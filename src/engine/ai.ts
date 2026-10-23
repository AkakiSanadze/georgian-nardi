import {
  applySingleMove,
  calculatePipCount,
  generateLegalTurnSequences,
  getOpponent,
  serializeBoardState,
} from './rules';
import { AIDifficulty, BoardState, DaviState, MatchScore, MoveSequence, Player } from './types';

// All 21 unique 2-dice rolls with their 36-fraction probabilities
export const DICE_ROLL_PROBABILITIES: { dice: [number, number]; prob: number }[] = [];
for (let d1 = 1; d1 <= 6; d1++) {
  for (let d2 = d1; d2 <= 6; d2++) {
    DICE_ROLL_PROBABILITIES.push({
      dice: [d1, d2],
      prob: d1 === d2 ? 1 / 36 : 2 / 36,
    });
  }
}

// Number of rolls out of 36 that produce distance d
const DIST_SHOT_ROLLS: Record<number, number> = {
  1: 11, // direct 1
  2: 12, // direct 2 + 1-1
  3: 14, // direct 3 + 2-1, 1-2, 1-1
  4: 15, // direct 4 + 3-1, 1-3, 2-2, 1-1
  5: 15, // direct 5 + 4-1, 1-4, 3-2, 2-3
  6: 17, // direct 6 + combinations
  7: 6,  // indirect combinations
  8: 6,
  9: 5,
  10: 3,
  11: 2,
  12: 3,
};

export interface HeuristicWeights {
  pip: number;
  borneOff: number;
  barOpponent: number;
  blotPenalty: number;
  homeBlotPenalty: number;
  primeLength: number;
  anchor: number;
}

export const DEFAULT_WEIGHTS: Record<AIDifficulty, HeuristicWeights> = {
  BEGINNER: {
    pip: 1.2,
    borneOff: 25.0,
    barOpponent: 14.0,
    blotPenalty: 8.0,
    homeBlotPenalty: 12.0,
    primeLength: 8.0,
    anchor: 6.0,
  },
  AMATEUR: {
    pip: 1.5,
    borneOff: 30.0,
    barOpponent: 20.0,
    blotPenalty: 12.0,
    homeBlotPenalty: 18.0,
    primeLength: 12.0,
    anchor: 10.0,
  },
  SKILLED: {
    pip: 1.8,
    borneOff: 35.0,
    barOpponent: 26.0,
    blotPenalty: 18.0,
    homeBlotPenalty: 28.0,
    primeLength: 18.0,
    anchor: 16.0,
  },
  GRANDMASTER: {
    pip: 2.2,
    borneOff: 40.0,
    barOpponent: 32.0,
    blotPenalty: 24.0,
    homeBlotPenalty: 35.0,
    primeLength: 26.0,
    anchor: 22.0,
  },
};

/**
 * Checks whether the board is in a pure race / bear-off stage where no contact exists.
 * When true, checkers cannot hit each other, meaning blot penalties are 0.
 */
export const isPureRace = (board: BoardState): boolean => {
  if (board.bar.WHITE > 0 || board.bar.BLACK > 0) return false;
  if (board.borneOff.WHITE === 15 || board.borneOff.BLACK === 15) return true;

  let maxWhite = -1;
  let minBlack = 24;

  for (let i = 0; i < 24; i++) {
    if (board.points[i].owner === 'WHITE' && board.points[i].count > 0) {
      if (i > maxWhite) maxWhite = i;
    }
    if (board.points[i].owner === 'BLACK' && board.points[i].count > 0) {
      if (i < minBlack) minBlack = i;
    }
  }

  // If one side has no checkers on board (all borne off)
  if (maxWhite === -1 || minBlack === 24) return true;

  // White moves towards 0, Black moves towards 23.
  // When all White checkers are at indices < minBlack, they have passed each other!
  return maxWhite < minBlack;
};

/**
 * Counts made points (points with 2+ checkers) in player's home board.
 */
export const countHomePoints = (board: BoardState, player: Player): number => {
  const start = player === 'WHITE' ? 0 : 18;
  const end = player === 'WHITE' ? 5 : 23;
  let count = 0;
  for (let i = start; i <= end; i++) {
    if (board.points[i].owner === player && board.points[i].count >= 2) {
      count++;
    }
  }
  return count;
};

/**
 * Calculates the exact probability (0.0 to 1.0) of an exposed blot at `pointIndex` being hit.
 */
export const calculateBlotRisk = (
  board: BoardState,
  player: Player,
  pointIndex: number
): number => {
  const opponent = getOpponent(player);
  let totalHitRolls = 0;

  // 1. Direct threat from opponent on the BAR
  if (board.bar[opponent] > 0) {
    if (player === 'BLACK' && pointIndex >= 18 && pointIndex <= 23) {
      // White enters at 24 - die. To hit pointIndex, die = 24 - pointIndex
      const dieNeeded = 24 - pointIndex;
      if (dieNeeded >= 1 && dieNeeded <= 6) {
        totalHitRolls += 11;
      }
    } else if (player === 'WHITE' && pointIndex >= 0 && pointIndex <= 5) {
      // Black enters at die - 1. To hit pointIndex, die = pointIndex + 1
      const dieNeeded = pointIndex + 1;
      if (dieNeeded >= 1 && dieNeeded <= 6) {
        totalHitRolls += 11;
      }
    }
  }

  // 2. Threats from opponent checkers on the board
  // Black moves 0 -> 23; White hits from q > pointIndex (q - pointIndex = dist)
  // White moves 23 -> 0; Black hits from q < pointIndex (pointIndex - q = dist)
  for (let q = 0; q < 24; q++) {
    if (board.points[q].owner === opponent && board.points[q].count > 0) {
      const dist = player === 'BLACK' ? q - pointIndex : pointIndex - q;
      if (dist >= 1 && dist <= 12) {
        const rolls = DIST_SHOT_ROLLS[dist] || 0;
        totalHitRolls = Math.min(35, totalHitRolls + rolls * 0.7);
      }
    }
  }

  return Math.min(1.0, totalHitRolls / 36);
};

/**
 * Advanced board evaluator.
 * Accurately analyzes pure race vs contact, blot danger, home board strength, primes, and golden points.
 */
export const evaluateBoard = (
  board: BoardState,
  player: Player,
  difficulty: AIDifficulty = 'SKILLED',
  personality?: 'CAUTIOUS' | 'BALANCED' | 'AGGRESSIVE' | 'MASTER'
): number => {
  const opponent = getOpponent(player);
  const pureRace = isPureRace(board);
  const effectivePersonality =
    personality || (difficulty === 'GRANDMASTER' ? 'MASTER' : undefined);

  // 1. Pip difference
  const myPip = calculatePipCount(board, player);
  const oppPip = calculatePipCount(board, opponent);

  if (pureRace) {
    // PURE RACE / BEAR-OFF EVALUATION
    // In pure race, bearing off is king. No blot can be hit!
    const borneOffDiff = board.borneOff[player] * 45 - board.borneOff[opponent] * 45;
    const pipDiff = (oppPip - myPip) * 3.0;

    // Smooth distribution in bear-off (penalize stacking > 3 checkers on deep points 0 or 23)
    let distributionPenalty = 0;
    const deepPoint = player === 'WHITE' ? 0 : 23;
    if (board.points[deepPoint].owner === player && board.points[deepPoint].count > 3) {
      distributionPenalty = (board.points[deepPoint].count - 3) * 5;
    }

    return borneOffDiff + pipDiff - distributionPenalty;
  }

  // CONTACT EVALUATION
  let pipWeight = 1.8;
  let barWeight = 26;
  let homePointWeight = 16;
  let blotSafetyWeight = 1.0;
  let primeWeight = 18;
  let anchorWeight = 16;

  if (difficulty === 'BEGINNER') {
    pipWeight = 1.2;
    barWeight = 16;
    homePointWeight = 10;
    blotSafetyWeight = 0.6;
    primeWeight = 10;
    anchorWeight = 8;
  } else if (difficulty === 'AMATEUR') {
    pipWeight = 1.5;
    barWeight = 22;
    homePointWeight = 14;
    blotSafetyWeight = 0.85;
    primeWeight = 14;
    anchorWeight = 12;
  } else if (difficulty === 'GRANDMASTER') {
    pipWeight = 2.2;
    barWeight = 32;
    homePointWeight = 22;
    blotSafetyWeight = 1.35;
    primeWeight = 24;
    anchorWeight = 20;
  }

  // Personality adjustments
  if (effectivePersonality === 'AGGRESSIVE') {
    barWeight *= 1.35;
    blotSafetyWeight *= 0.8;
  } else if (effectivePersonality === 'CAUTIOUS') {
    blotSafetyWeight *= 1.45;
    anchorWeight *= 1.3;
    homePointWeight *= 1.2;
  } else if (effectivePersonality === 'MASTER') {
    barWeight *= 1.2;
    primeWeight *= 1.25;
    homePointWeight *= 1.25;
    anchorWeight *= 1.2;
  }

  // 1. Pip score
  const pipScore = (oppPip - myPip) * pipWeight;

  // 2. Borne off checkers
  const borneOffScore = (board.borneOff[player] - board.borneOff[opponent]) * 35;

  // 3. Bar score
  const barScore = (board.bar[opponent] - board.bar[player]) * barWeight;

  // 4. Opponent Home Board Strength & Blot Risk
  const oppHomePoints = countHomePoints(board, opponent);
  const myHomePoints = countHomePoints(board, player);

  // Danger factor based on opponent home board:
  const oppBoardDangerMultiplier = 0.8 + oppHomePoints * 0.35;

  let blotScore = 0;
  for (let i = 0; i < 24; i++) {
    const point = board.points[i];
    if (point.owner === player && point.count === 1) {
      const hitProb = calculateBlotRisk(board, player, i);
      if (hitProb > 0.01) {
        const pipsLost = player === 'WHITE' ? 24 - i : i + 1;
        const blotPenalty =
          (14 + pipsLost * 0.9) * hitProb * oppBoardDangerMultiplier * blotSafetyWeight;
        blotScore -= blotPenalty;
      }
    }
    // Also reward player when opponent has exposed blots
    if (point.owner === opponent && point.count === 1) {
      const oppHitProb = calculateBlotRisk(board, opponent, i);
      if (oppHitProb > 0.01) {
        const oppPipsLost = opponent === 'WHITE' ? 24 - i : i + 1;
        blotScore += (10 + oppPipsLost * 0.6) * oppHitProb;
      }
    }
  }

  // 5. Home board strength (symmetric)
  const homeBoardValues = [0, 12, 26, 44, 68, 100, 150];
  const homeBoardScore =
    (homeBoardValues[Math.min(6, myHomePoints)] - homeBoardValues[Math.min(6, oppHomePoints)]) *
    (homePointWeight / 16);

  // 6. Strategic Golden Points & Bar Points (symmetric)
  let strategicPointsScore = 0;
  const myGoldenPoint = player === 'WHITE' ? 4 : 19;
  const oppGoldenPoint = player === 'WHITE' ? 19 : 4;
  const myBarPoint = player === 'WHITE' ? 6 : 17;
  const oppBarPoint = player === 'WHITE' ? 17 : 6;

  // Player's key points
  if (board.points[myGoldenPoint].owner === player && board.points[myGoldenPoint].count >= 2) {
    strategicPointsScore += 24;
  }
  if (board.points[myBarPoint].owner === player && board.points[myBarPoint].count >= 2) {
    strategicPointsScore += 16;
  }
  if (board.points[oppGoldenPoint].owner === player && board.points[oppGoldenPoint].count >= 2) {
    strategicPointsScore += 26; // Advanced Anchor in opponent home!
  }

  // Opponent's key points
  if (board.points[oppGoldenPoint].owner === opponent && board.points[oppGoldenPoint].count >= 2) {
    strategicPointsScore -= 24;
  }
  if (board.points[oppBarPoint].owner === opponent && board.points[oppBarPoint].count >= 2) {
    strategicPointsScore -= 16;
  }
  if (board.points[myGoldenPoint].owner === opponent && board.points[myGoldenPoint].count >= 2) {
    strategicPointsScore -= 26; // Opponent advanced anchor in player home!
  }

  // 7. Primes (longest chain of consecutive made points, symmetric)
  const calcMaxPrime = (p: Player): number => {
    let max = 0;
    let curr = 0;
    for (let i = 0; i < 24; i++) {
      if (board.points[i].owner === p && board.points[i].count >= 2) {
        curr++;
        if (curr > max) max = curr;
      } else {
        curr = 0;
      }
    }
    return max;
  };

  const getPrimeBonus = (primeLen: number): number => {
    if (primeLen === 3) return 14;
    if (primeLen === 4) return 32;
    if (primeLen === 5) return 60;
    if (primeLen >= 6) return 110;
    return 0;
  };

  const primeScore =
    (getPrimeBonus(calcMaxPrime(player)) - getPrimeBonus(calcMaxPrime(opponent))) *
    (primeWeight / 18);

  // 8. Anchors in opponent home (symmetric)
  const calcAnchors = (p: Player): number => {
    const homeStart = p === 'WHITE' ? 18 : 0;
    const homeEnd = p === 'WHITE' ? 23 : 5;
    const oppGold = p === 'WHITE' ? 19 : 4;
    let total = 0;
    for (let i = homeStart; i <= homeEnd; i++) {
      if (i !== oppGold && board.points[i].owner === p && board.points[i].count >= 2) {
        total++;
      }
    }
    return total;
  };
  const anchorScore = (calcAnchors(player) - calcAnchors(opponent)) * anchorWeight;

  // 9. Back checkers mobility (symmetric)
  const myStartPoint = player === 'WHITE' ? 23 : 0;
  const oppStartPoint = player === 'WHITE' ? 0 : 23;
  const myBackCount =
    board.points[myStartPoint].owner === player ? board.points[myStartPoint].count : 0;
  const oppBackCount =
    board.points[oppStartPoint].owner === opponent ? board.points[oppStartPoint].count : 0;
  const backCheckersScore = (oppBackCount - myBackCount) * 8;

  // 10. Mars (Gammon) threat bonus
  let marsBonus = 0;
  if (board.borneOff[opponent] === 0 && board.borneOff[player] >= 6) {
    marsBonus += (board.borneOff[player] - 5) * 8;
    if (board.bar[opponent] > 0 || oppBackCount >= 2) {
      marsBonus += 25;
    }
  }
  if (board.borneOff[player] === 0 && board.borneOff[opponent] >= 6) {
    marsBonus -= (board.borneOff[opponent] - 5) * 8;
    if (board.bar[player] > 0 || myBackCount >= 2) {
      marsBonus -= 25;
    }
  }

  return (
    pipScore +
    borneOffScore +
    barScore +
    blotScore +
    homeBoardScore +
    strategicPointsScore +
    primeScore +
    anchorScore +
    backCheckersScore +
    marsBonus
  );
};

/**
 * Estimates win probability for `player` based on board heuristic score.
 */
export const estimateWinProbability = (
  board: BoardState,
  player: Player,
  difficulty: AIDifficulty = 'SKILLED'
): number => {
  const opponent = getOpponent(player);
  if (isPureRace(board)) {
    const myPip = calculatePipCount(board, player);
    const oppPip = calculatePipCount(board, opponent);
    if (myPip === 0) return 1.0;
    if (oppPip === 0) return 0.0;
    const diff = oppPip - myPip;
    const avg = (myPip + oppPip) / 2;
    const leadPct = diff / avg;
    const prob = 1 / (1 + Math.exp(-8.0 * leadPct));
    return Math.min(0.99, Math.max(0.01, prob));
  }

  const score = evaluateBoard(board, player, difficulty, 'MASTER');
  const k = 0.015;
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

  const effectivePersonality =
    personality || (difficulty === 'GRANDMASTER' ? 'MASTER' : undefined);

  // Helper to evaluate board resulting from a sequence
  const evaluateSequenceResult = (seq: MoveSequence): number => {
    let b = board;
    for (const m of seq.moves) {
      b = applySingleMove(b, player, m);
    }
    const finalBoard = { ...b, lockedHomeHitPoints: [] };
    return evaluateBoard(finalBoard, player, difficulty, effectivePersonality);
  };

  // 1. Beginner: makes human-like beginner mistakes
  if (difficulty === 'BEGINNER') {
    // 25% chance of picking a random legal sequence
    if (Math.random() < 0.25) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
    const scored = candidates.map((seq) => ({
      seq,
      score: evaluateSequenceResult(seq) + (Math.random() * 50 - 25),
    }));
    scored.sort((a, b) => b.score - a.score);
    const topChoices = scored.slice(0, Math.min(3, scored.length));
    const pick = topChoices[Math.floor(Math.random() * topChoices.length)];
    return pick.seq;
  }

  // 2. Amateur: 1-ply heuristic selection with occasional slight inaccuracy
  if (difficulty === 'AMATEUR') {
    const scored = candidates.map((seq) => ({
      seq,
      score: evaluateSequenceResult(seq) + (Math.random() * 16 - 8),
    }));
    scored.sort((a, b) => b.score - a.score);
    if (scored.length > 1 && Math.random() < 0.10) {
      return scored[1].seq;
    }
    return scored[0].seq;
  }

  // 3. Skilled: pure optimal 1-ply heuristic selection
  if (difficulty === 'SKILLED') {
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

  // 4. Grandmaster: Deep 2-ply Expectiminimax lookahead across top candidates
  const scoredCandidates = candidates.map((seq) => ({
    seq,
    score1Ply: evaluateSequenceResult(seq),
  }));
  scoredCandidates.sort((a, b) => b.score1Ply - a.score1Ply);

  // If candidate 1 is clearly superior (> 25 pts ahead), pick it immediately
  if (
    scoredCandidates.length === 1 ||
    scoredCandidates[0].score1Ply - scoredCandidates[1].score1Ply > 25
  ) {
    return scoredCandidates[0].seq;
  }

  // Evaluate top 3 candidates for fast, ultra-responsive play on mobile
  const topCandidates = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
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
      const oppDice =
        roll.dice[0] === roll.dice[1]
          ? [roll.dice[0], roll.dice[0], roll.dice[0], roll.dice[0]]
          : [roll.dice[0], roll.dice[1]];

      const oppSequences = generateLegalTurnSequences(endTurnBoard, opponent, oppDice);

      if (oppSequences.length === 0) {
        expectedOpponentScore +=
          roll.prob * evaluateBoard(endTurnBoard, player, 'GRANDMASTER', 'MASTER');
      } else {
        let minPlayerScore = Infinity;
        for (const oppSeq of oppSequences) {
          let oppBoard: BoardState = endTurnBoard;
          for (const om of oppSeq.moves) {
            oppBoard = applySingleMove(oppBoard, opponent, om);
          }
          const pScore = evaluateBoard(oppBoard, player, 'GRANDMASTER', 'MASTER');
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

  // Too good to double: if AI has massive win probability (> 86%) and opponent has 0 borne off,
  // play for Mars/Gammon instead of forcing opponent to drop
  const opponent = getOpponent(player);
  if (winProb > 0.86 && board.borneOff[opponent] === 0 && board.borneOff[player] >= 4) {
    return false;
  }

  // Different thresholds based on difficulty
  const thresholds: Record<AIDifficulty, number> = {
    BEGINNER: 0.82,
    AMATEUR: 0.74,
    SKILLED: 0.69,
    GRANDMASTER: 0.66,
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

  // If dropping loses the match anyway, ALWAYS accept!
  const opponent = getOpponent(player);
  if (matchScore[opponent] + 1 >= matchScore.targetScore) {
    return true;
  }

  const dropThresholds: Record<AIDifficulty, number> = {
    BEGINNER: 0.35,
    AMATEUR: 0.28,
    SKILLED: 0.24,
    GRANDMASTER: 0.22,
  };

  return winProb >= dropThresholds[difficulty];
};
