import { BoardState, MoveSequence, Player, SingleMove } from './types';

export const isHomeBoard = (player: Player, pointIndex: number): boolean => {
  if (pointIndex < 0 || pointIndex > 23) return false;
  return player === 'WHITE' ? pointIndex <= 5 : pointIndex >= 18;
};

export const getOpponent = (player: Player): Player => (player === 'WHITE' ? 'BLACK' : 'WHITE');

export const cloneBoard = (board: BoardState): BoardState => ({
  points: board.points.map((p) => ({ ...p })),
  bar: { ...board.bar },
  borneOff: { ...board.borneOff },
  lockedHomeHitPoints: [...board.lockedHomeHitPoints],
});

export const canBearOff = (board: BoardState, player: Player): boolean => {
  if (board.bar[player] > 0) return false;

  if (player === 'WHITE') {
    // For WHITE, checkers outside home board (indices 6..23) must be 0
    for (let i = 6; i <= 23; i++) {
      if (board.points[i].owner === 'WHITE' && board.points[i].count > 0) {
        return false;
      }
    }
  } else {
    // For BLACK, checkers outside home board (indices 0..17) must be 0
    for (let i = 0; i <= 17; i++) {
      if (board.points[i].owner === 'BLACK' && board.points[i].count > 0) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Checks if there are any checkers situated further back than `pointIndex` in the player's home board.
 * Used for bear-off when the die roll is greater than the point distance.
 */
export const hasCheckersFurtherBackInHome = (
  board: BoardState,
  player: Player,
  pointIndex: number
): boolean => {
  if (player === 'WHITE') {
    // Points 0..5. Higher index means further away from bear-off.
    for (let i = pointIndex + 1; i <= 5; i++) {
      if (board.points[i].owner === 'WHITE' && board.points[i].count > 0) {
        return true;
      }
    }
  } else {
    // Points 18..23. Lower index means further away from bear-off.
    for (let i = pointIndex - 1; i >= 18; i--) {
      if (board.points[i].owner === 'BLACK' && board.points[i].count > 0) {
        return true;
      }
    }
  }
  return false;
};

/**
 * Returns all legal single moves for a specific die value given the current board state.
 * Strictly enforces Georgian rules:
 * - Checkers on lockedHomeHitPoints CANNOT move or bear off.
 * - No checker can land on or cover a lockedHomeHitPoint.
 */
export const getLegalSingleMovesForDie = (
  board: BoardState,
  player: Player,
  die: number
): SingleMove[] => {
  const moves: SingleMove[] = [];
  const opponent = getOpponent(player);

  // 1. If player has checkers on the BAR, they MUST enter first!
  if (board.bar[player] > 0) {
    const target = player === 'WHITE' ? 24 - die : die - 1;

    // Check if target is locked by previous home-board hit
    if (!board.lockedHomeHitPoints.includes(target)) {
      const targetPoint = board.points[target];
      const isBlocked = targetPoint.owner === opponent && targetPoint.count >= 2;

      if (!isBlocked) {
        const isHit = targetPoint.owner === opponent && targetPoint.count === 1;
        const isHomeHit = isHit && isHomeBoard(player, target);
        moves.push({
          from: 'BAR',
          to: target,
          dieUsed: die,
          isHit,
          isHomeBoardHit: isHomeHit,
        });
      }
    }
    return moves; // If bar > 0, no other checker can move
  }

  const bearingOffAllowed = canBearOff(board, player);

  // 2. Normal checker moves from board points
  for (let from = 0; from < 24; from++) {
    const point = board.points[from];
    if (point.owner !== player || point.count === 0) continue;

    // Georgian Rule: Checker on lockedHomeHitPoint CANNOT move!
    if (board.lockedHomeHitPoints.includes(from)) {
      continue;
    }

    if (player === 'WHITE') {
      const target = from - die;

      if (target >= 0) {
        // Normal move to target point
        if (!board.lockedHomeHitPoints.includes(target)) {
          const targetPoint = board.points[target];
          const isBlocked = targetPoint.owner === opponent && targetPoint.count >= 2;

          if (!isBlocked) {
            const isHit = targetPoint.owner === opponent && targetPoint.count === 1;
            const isHomeHit = isHit && isHomeBoard(player, target);
            moves.push({
              from,
              to: target,
              dieUsed: die,
              isHit,
              isHomeBoardHit: isHomeHit,
            });
          }
        }
      } else if (bearingOffAllowed) {
        // Bearing off for WHITE
        // Exact roll: from === die - 1 (target === -1)
        if (from === die - 1) {
          moves.push({
            from,
            to: 'OFF',
            dieUsed: die,
            isHit: false,
            isHomeBoardHit: false,
          });
        } else if (from < die - 1) {
          // Over-roll: only allowed if no checkers exist behind it in home board
          if (!hasCheckersFurtherBackInHome(board, player, from)) {
            moves.push({
              from,
              to: 'OFF',
              dieUsed: die,
              isHit: false,
              isHomeBoardHit: false,
            });
          }
        }
      }
    } else {
      // BLACK player
      const target = from + die;

      if (target <= 23) {
        // Normal move to target point
        if (!board.lockedHomeHitPoints.includes(target)) {
          const targetPoint = board.points[target];
          const isBlocked = targetPoint.owner === opponent && targetPoint.count >= 2;

          if (!isBlocked) {
            const isHit = targetPoint.owner === opponent && targetPoint.count === 1;
            const isHomeHit = isHit && isHomeBoard(player, target);
            moves.push({
              from,
              to: target,
              dieUsed: die,
              isHit,
              isHomeBoardHit: isHomeHit,
            });
          }
        }
      } else if (bearingOffAllowed) {
        // Bearing off for BLACK (target > 23)
        // Exact roll: from === 24 - die
        if (from === 24 - die) {
          moves.push({
            from,
            to: 'OFF',
            dieUsed: die,
            isHit: false,
            isHomeBoardHit: false,
          });
        } else if (from > 24 - die) {
          // Over-roll: only allowed if no checkers exist behind it in home board
          if (!hasCheckersFurtherBackInHome(board, player, from)) {
            moves.push({
              from,
              to: 'OFF',
              dieUsed: die,
              isHit: false,
              isHomeBoardHit: false,
            });
          }
        }
      }
    }
  }

  return moves;
};

/**
 * Applies a single move immutably and returns the new board state.
 * If forbidHitAndHideInHome is true and the move is a home-board hit, records the destination in lockedHomeHitPoints.
 */
export const applySingleMove = (
  board: BoardState,
  player: Player,
  move: SingleMove,
  forbidHitAndHideInHome: boolean = false
): BoardState => {
  const next = cloneBoard(board);
  const opponent = getOpponent(player);

  // 1. Remove checker from source
  if (move.from === 'BAR') {
    next.bar[player]--;
  } else {
    next.points[move.from].count--;
    if (next.points[move.from].count === 0) {
      next.points[move.from].owner = null;
    }
  }

  // 2. Add checker to destination
  if (move.to === 'OFF') {
    next.borneOff[player]++;
  } else {
    // If it's a hit, send opponent to bar
    if (move.isHit) {
      next.bar[opponent]++;
      next.points[move.to].count = 0;
      next.points[move.to].owner = null;
    }

    next.points[move.to].owner = player;
    next.points[move.to].count++;

    // Lock point only if forbidHitAndHideInHome rule is active
    if (move.isHomeBoardHit && forbidHitAndHideInHome) {
      if (!next.lockedHomeHitPoints.includes(move.to)) {
        next.lockedHomeHitPoints.push(move.to);
      }
    }
  }

  return next;
};

/**
 * Recursively generates all legal full-turn move sequences using DFS.
 * Enforces:
 * 1. Georgian Home-Board Hit Lock (when forbidHitAndHideInHome is active).
 * 2. Maximum dice usage rule.
 * 3. Higher die priority rule when only 1 die can be played.
 * 4. Preserves distinct move-order paths so human players can choose either valid first die.
 */
export const generateLegalTurnSequences = (
  board: BoardState,
  player: Player,
  availableDice: number[],
  forbidHitAndHideInHome: boolean = false
): MoveSequence[] => {
  if (availableDice.length === 0) return [];

  const validSequences: MoveSequence[] = [];

  const dfs = (
    currentBoard: BoardState,
    currentMoves: SingleMove[],
    remainingDice: number[],
    diceIndicesUsed: number[]
  ) => {
    if (isRoundWon(currentBoard, player)) {
      validSequences.push({
        moves: currentMoves,
        diceUsed: diceIndicesUsed,
      });
      return;
    }

    let hasValidBranch = false;
    const triedValues = new Set<number>();

    for (let i = 0; i < remainingDice.length; i++) {
      const die = remainingDice[i];
      if (triedValues.has(die)) continue;
      triedValues.add(die);

      const legalMoves = getLegalSingleMovesForDie(currentBoard, player, die);

      for (const move of legalMoves) {
        hasValidBranch = true;
        const nextBoard = applySingleMove(currentBoard, player, move, forbidHitAndHideInHome);
        const nextRemaining = [...remainingDice];
        nextRemaining.splice(i, 1);

        dfs(
          nextBoard,
          [...currentMoves, move],
          nextRemaining,
          [...diceIndicesUsed, die]
        );
      }
    }

    // If no further moves can be made with remaining dice, this is a terminal path
    if (!hasValidBranch && currentMoves.length > 0) {
      validSequences.push({
        moves: currentMoves,
        diceUsed: diceIndicesUsed,
      });
    }
  };

  dfs(board, [], availableDice, []);

  if (validSequences.length === 0) {
    return [];
  }

  // Maximum Dice Rule
  const maxLen = Math.max(...validSequences.map((s) => s.moves.length));
  let filtered = validSequences.filter(
    (s) =>
      s.moves.length === maxLen ||
      (forbidHitAndHideInHome && s.moves.some((m) => m.isHomeBoardHit)) ||
      isSequenceWinning(board, player, s)
  );

  // Higher Die Rule: If only 1 die could be played (and no home-board hit exception applies) and dice are distinct,
  // the player MUST play the higher die if a move with it is possible!
  const nonHitMaxLen = Math.max(
    0,
    ...filtered.filter((s) => !s.moves.some((m) => m.isHomeBoardHit)).map((s) => s.moves.length)
  );

  if (nonHitMaxLen === 1 && availableDice.length >= 2 && availableDice[0] !== availableDice[1]) {
    const higherDie = Math.max(...availableDice);
    const hasHigherDieMove = filtered.some(
      (s) => !s.moves.some((m) => m.isHomeBoardHit) && s.moves[0].dieUsed === higherDie
    );
    if (hasHigherDieMove) {
      filtered = filtered.filter(
        (s) => s.moves.some((m) => m.isHomeBoardHit) || s.moves[0].dieUsed === higherDie
      );
    }
  }

  // Deduplicate by exact move path so both dice orders (e.g. 12->8->6 and 12->10->6) remain available to the UI
  const uniqueSequences: MoveSequence[] = [];
  const visitedPaths = new Set<string>();

  for (const seq of filtered) {
    const pathKey = seq.moves
      .map((m) => `${m.from}>${m.to}:${m.dieUsed}`)
      .join('|');
    if (!visitedPaths.has(pathKey)) {
      visitedPaths.add(pathKey);
      uniqueSequences.push(seq);
    }
  }

  return uniqueSequences;
};

const isSequenceWinning = (board: BoardState, player: Player, seq: MoveSequence): boolean => {
  let b = board;
  for (const m of seq.moves) {
    b = applySingleMove(b, player, m);
  }
  return isRoundWon(b, player);
};

export const serializeBoardState = (b: BoardState): string => {
  const pts = b.points.map((p) => `${p.owner || '-'}${p.count}`).join(',');
  return `${pts}|W${b.bar.WHITE}B${b.bar.BLACK}|W${b.borneOff.WHITE}B${b.borneOff.BLACK}|L${[
    ...b.lockedHomeHitPoints,
  ]
    .sort()
    .join('.')}`;
};

export const isRoundWon = (board: BoardState, player: Player): boolean => {
  return board.borneOff[player] >= 15;
};

/**
 * Checks if the loser suffered a Koksi (Backgammon - 3x):
 * 0 checkers borne off AND at least 1 checker on the BAR or inside the winner's home board.
 */
export const isKoksiLoss = (board: BoardState, loser: Player): boolean => {
  if (board.borneOff[loser] > 0) return false;
  if (board.bar[loser] > 0) return true;

  const winner = getOpponent(loser);
  for (let i = 0; i < 24; i++) {
    if (isHomeBoard(winner, i) && board.points[i].owner === loser && board.points[i].count > 0) {
      return true;
    }
  }
  return false;
};

export const calculatePipCount = (board: BoardState, player: Player): number => {
  let pip = 0;
  if (player === 'WHITE') {
    pip += board.bar.WHITE * 25;
    for (let i = 0; i < 24; i++) {
      if (board.points[i].owner === 'WHITE') {
        pip += board.points[i].count * (i + 1);
      }
    }
  } else {
    pip += board.bar.BLACK * 25;
    for (let i = 0; i < 24; i++) {
      if (board.points[i].owner === 'BLACK') {
        pip += board.points[i].count * (24 - i);
      }
    }
  }
  return pip;
};
