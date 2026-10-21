import {
  applySingleMove,
  calculatePipCount,
  generateLegalTurnSequences,
  getOpponent,
  isHomeBoard,
  serializeBoardState,
} from './rules';
import { AIDifficulty, BoardState, DaviState, MatchScore, MoveSequence, Player } from './types';

// All 21 unique 2-dice rolls with their 36-fraction probabilities
const DICE_ROLL_PROBABILITIES: { dice: [number, number]; prob: number }[] = [];
for (let d1 = 1; d1 <= 6; d1++) {
  for (let d2 = d1; d2 <= 6; d2++) {
    DICE_ROLL_PROBABILITIES.push({
      dice: [d1, d2],
      prob: d1 === d2 ? 1 / 36 : 2 / 36,
    });
  }
}

export interface HeuristicWeights {
  pip: number;
  borneOff: number;
  barOpponent: number;
  blotPenalty: number;
  homeBlotPenalty: number;
  primeLength: number;
  anchor: number;
}

const DEFAULT_WEIGHTS: Record<AIDifficulty, HeuristicWeights> = {
  BEGINNER: {
    pip: 1.0,
    borneOff: 20.0,
    barOpponent: 12.0,
    blotPenalty: 8.0,
    homeBlotPenalty: 12.0,
    primeLength: 6.0,
    anchor: 4.0,
  },
  AMATEUR: {
    pip: 1.5,
    borneOff: 25.0,
    barOpponent: 18.0,
    blotPenalty: 14.0,
    homeBlotPenalty: 22.0,
    primeLength: 10.0,
    anchor: 7.0,
  },
  SKILLED: {
    pip: 1.8,
    borneOff: 30.0,
    barOpponent: 24.0,
    blotPenalty: 18.0,
    homeBlotPenalty: 28.0,
    primeLength: 16.0,
    anchor: 12.0,
  },
  GRANDMASTER: {
    pip: 2.0,
    borneOff: 35.0,
    barOpponent: 28.0,
    blotPenalty: 22.0,
    homeBlotPenalty: 35.0,
    primeLength: 22.0,
    anchor: 16.0,
  },
};

/**
 * Static heuristic board evaluator from the perspective of `player`.
 * Higher is better for `player`.
 */
export const evaluateBoard = (
  board: BoardState,
  player: Player,
  difficulty: AIDifficulty = 'SKILLED',
  personality?: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE' | 'MASTER'
): number => {
  const opponent = getOpponent(player);
  const weights = { ...DEFAULT_WEIGHTS[difficulty] };

  if (personality === 'AGGRESSIVE') {
    weights.barOpponent *= 1.3;
    weights.blotPenalty *= 0.8;
  } else if (personality === 'CAUTIOUS') {
    weights.blotPenalty *= 1.4;
    weights.homeBlotPenalty *= 1.4;
    weights.anchor *= 1.3;
  }

  // 1. Pip difference
  const myPip = calculatePipCount(board, player);
  const oppPip = calculatePipCount(board, opponent);
  const pipScore = (oppPip - myPip) * weights.pip;

  // 2. Borne off checkers
  const borneOffScore =
    board.borneOff[player] * weights.borneOff -
    board.borneOff[opponent] * weights.borneOff;

  // 3. Opponent checkers on Bar vs Own checkers on Bar
  const barScore =
    board.bar[opponent] * weights.barOpponent -
    board.bar[player] * (weights.barOpponent * 1.2);

  // 4. Blots penalty (open single checkers)
  let blotScore = 0;
  for (let i = 0; i < 24; i++) {
    const point = board.points[i];
    if (point.owner === player && point.count === 1) {
      if (isHomeBoard(player, i)) {
        blotScore -= weights.homeBlotPenalty;
      } else {
        blotScore -= weights.blotPenalty;
      }
    }
  }

  // 5. Primes (chains of consecutive made points)
  let maxPrime = 0;
  let currentPrime = 0;
  for (let i = 0; i < 24; i++) {
    if (board.points[i].owner === player && board.points[i].count >= 2) {
      currentPrime++;
      if (currentPrime > maxPrime) maxPrime = currentPrime;
    } else {
      currentPrime = 0;
    }
  }
  const primeScore = maxPrime >= 3 ? maxPrime * weights.primeLength : 0;

  // 6. Anchors in opponent's home board
  let anchorScore = 0;
  const oppHomeStart = player === 'WHITE' ? 18 : 0;
  const oppHomeEnd = player === 'WHITE' ? 23 : 5;
  for (let i = oppHomeStart; i <= oppHomeEnd; i++) {
    if (board.points[i].owner === player && board.points[i].count >= 2) {
      anchorScore += weights.anchor;
    }
  }

  return pipScore + borneOffScore + barScore + blotScore + primeScore + anchorScore;
};

/**
 * Estimates win probability for `player` based on board heuristic score.
 * Mapped using a sigmoid logistic function.
 */
export const estimateWinProbability = (
  board: BoardState,
  player: Player,
  difficulty: AIDifficulty = 'SKILLED'
): number => {
  const score = evaluateBoard(board, player, difficulty);
  // Scale score to reasonable probability range [0.01 .. 0.99]
  const k = 0.025;
  const prob = 1 / (1 + Math.exp(-k * score));
  return Math.min(0.99, Math.max(0.01, prob));
};

/**
 * Picks the best move sequence for AI according to difficulty.
 */
export const chooseBestMoveSequence = (
  board: BoardState,
  player: Player,
  legalSequences: MoveSequence[],
  difficulty: AIDifficulty,
  personality?: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE' | 'MASTER'
): MoveSequence | null => {
  if (legalSequences.length === 0) return null;
  if (legalSequences.length === 1) return legalSequences[0];

  // Deduplicate sequences that result in the exact same board state for faster AI evaluation
  const uniqueSequences: MoveSequence[] = [];
  const seenStates = new Set<string>();
  for (const seq of legalSequences) {
    let b = board;
    for (const m of seq.moves) {
      b = applySingleMove(b, player, m);
    }
    const key = serializeBoardState(b);
    if (!seenStates.has(key)) {
      seenStates.add(key);
      uniqueSequences.push(seq);
    }
  }
  const candidates = uniqueSequences.length > 0 ? uniqueSequences : legalSequences;
  if (candidates.length === 1) return candidates[0];

  // Helper to evaluate board resulting from a sequence
  const evaluateSequenceResult = (seq: MoveSequence): number => {
    let b = board;
    for (const m of seq.moves) {
      b = applySingleMove(b, player, m);
    }
    // Clean up lockedHomeHitPoints for final position evaluation since turn ends
    const finalBoard = { ...b, lockedHomeHitPoints: [] };
    return evaluateBoard(finalBoard, player, difficulty, personality);
  };

  // 1. Beginner: evaluate, add noise, pick randomly from top candidates
  if (difficulty === 'BEGINNER') {
    const scored = candidates.map((seq) => ({
      seq,
      score: evaluateSequenceResult(seq) + (Math.random() * 80 - 40),
    }));
    scored.sort((a, b) => b.score - a.score);
    const topChoices = scored.slice(0, Math.min(3, scored.length));
    const pick = topChoices[Math.floor(Math.random() * topChoices.length)];
    return pick.seq;
  }

  // 2. Amateur: 1-ply heuristic selection
  if (difficulty === 'AMATEUR') {
    let bestSeq = candidates[0];
    let bestScore = -Infinity;

    for (const seq of candidates) {
      const score = evaluateSequenceResult(seq);
      if (score > bestScore) {
        bestScore = score;
        bestSeq = seq;
      }
    }
    return bestSeq;
  }

  // 3. Skilled: 1-ply + opponent direct shot penalty
  if (difficulty === 'SKILLED') {
    let bestSeq = candidates[0];
    let bestScore = -Infinity;

    for (const seq of candidates) {
      let b = board;
      for (const m of seq.moves) {
        b = applySingleMove(b, player, m);
      }
      const score = evaluateBoard(b, player, 'SKILLED', personality);
      if (score > bestScore) {
        bestScore = score;
        bestSeq = seq;
      }
    }
    return bestSeq;
  }

  // 4. Grandmaster: Top candidates shallow Expectiminimax rollout
  // Rank candidates by 1-ply, then roll out sample dice for top 4 candidates
  const scoredCandidates = candidates.map((seq) => ({
    seq,
    score1Ply: evaluateSequenceResult(seq),
  }));
  scoredCandidates.sort((a, b) => b.score1Ply - a.score1Ply);

  const topCandidates = scoredCandidates.slice(0, Math.min(4, scoredCandidates.length));
  if (topCandidates.length === 1) return topCandidates[0].seq;

  let bestGMSeq = topCandidates[0].seq;
  let bestGMScore = -Infinity;
  const opponent = getOpponent(player);

  for (const { seq } of topCandidates) {
    let b = board;
    for (const m of seq.moves) {
      b = applySingleMove(b, player, m);
    }
    const endTurnBoard: BoardState = { ...b, lockedHomeHitPoints: [] };

    // Expectiminimax over all 21 dice rolls for opponent
    let expectedOpponentScore = 0;

    for (const roll of DICE_ROLL_PROBABILITIES) {
      const oppDice = roll.dice[0] === roll.dice[1]
        ? [roll.dice[0], roll.dice[0], roll.dice[0], roll.dice[0]]
        : [roll.dice[0], roll.dice[1]];

      const oppSequences = generateLegalTurnSequences(endTurnBoard, opponent, oppDice);

      if (oppSequences.length === 0) {
        // Opponent has no moves, score position as is
        expectedOpponentScore += roll.prob * evaluateBoard(endTurnBoard, player, 'GRANDMASTER');
      } else {
        // Opponent picks their best move (minimax)
        let minPlayerScore = Infinity;
        for (const oppSeq of oppSequences) {
          let oppBoard: BoardState = endTurnBoard;
          for (const om of oppSeq.moves) {
            oppBoard = applySingleMove(oppBoard, opponent, om);
          }
          const pScore = evaluateBoard(oppBoard, player, 'GRANDMASTER');
          if (pScore < minPlayerScore) {
            minPlayerScore = pScore;
          }
        }
        expectedOpponentScore += roll.prob * minPlayerScore;
      }
    }

    if (expectedOpponentScore > bestGMScore) {
      bestGMScore = expectedOpponentScore;
      bestGMSeq = seq;
    }
  }

  return bestGMSeq;
};

/**
 * Determines whether AI should offer Davi before rolling.
 */
export const shouldAIOfferDavi = (
  board: BoardState,
  player: Player,
  daviState: DaviState,
  matchScore: MatchScore,
  difficulty: AIDifficulty
): boolean => {
  // Crawford rule check: no doubling allowed in Crawford round!
  if (matchScore.isCrawford) return false;

  // Cannot offer if opponent owns the Davi
  if (daviState.owner !== null && daviState.owner !== player) return false;

  // Max Davi level reached
  if (daviState.level >= 5) return false;

  // Don't offer Davi if current score + current value already wins the match
  if (matchScore[player] + daviState.value >= matchScore.targetScore) {
    return false;
  }

  const winProb = estimateWinProbability(board, player, difficulty);

  // Different thresholds based on difficulty
  const thresholds: Record<AIDifficulty, number> = {
    BEGINNER: 0.85,
    AMATEUR: 0.76,
    SKILLED: 0.70,
    GRANDMASTER: 0.67,
  };

  return winProb >= thresholds[difficulty];
};

/**
 * Determines whether AI should accept or drop a Davi offered by opponent.
 */
export const shouldAIAcceptDavi = (
  board: BoardState,
  player: Player,
  matchScore: MatchScore,
  difficulty: AIDifficulty
): boolean => {
  const winProb = estimateWinProbability(board, player, difficulty);

  // Classic backgammon break-even is ~25%.
  // If dropping loses the match anyway, always accept!
  if (matchScore[player] <= 1 && matchScore.targetScore - matchScore[getOpponent(player)] <= 2) {
    if (winProb >= 0.15) return true;
  }

  const dropThresholds: Record<AIDifficulty, number> = {
    BEGINNER: 0.20,
    AMATEUR: 0.24,
    SKILLED: 0.25,
    GRANDMASTER: 0.26,
  };

  return winProb >= dropThresholds[difficulty];
};
