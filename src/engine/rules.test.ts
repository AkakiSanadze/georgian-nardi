import { describe, expect, it } from 'vitest';
import {
  applySingleMove,
  canBearOff,
  generateLegalTurnSequences,
  getLegalSingleMovesForDie,
  isKoksiLoss,
} from './rules';
import { BoardState, SingleMove } from './types';

const createEmptyBoard = (): BoardState => ({
  points: Array.from({ length: 24 }, () => ({ owner: null, count: 0 })),
  bar: { WHITE: 0, BLACK: 0 },
  borneOff: { WHITE: 0, BLACK: 0 },
  lockedHomeHitPoints: [],
});

describe('Georgian Backgammon Rules Engine', () => {
  it('Georgian Rule: Hit inside own home board locks the point when forbidHitAndHideInHome is true', () => {
    const board = createEmptyBoard();

    // WHITE moves 23 -> 0. Home board is 0..5.
    board.points[6] = { owner: 'WHITE', count: 1 };
    board.points[3] = { owner: 'BLACK', count: 1 };
    board.points[5] = { owner: 'WHITE', count: 1 };

    const hitMove: SingleMove = {
      from: 6,
      to: 3,
      dieUsed: 3,
      isHit: true,
      isHomeBoardHit: true,
    };

    const boardAfterHit = applySingleMove(board, 'WHITE', hitMove, true);

    expect(boardAfterHit.points[3].owner).toBe('WHITE');
    expect(boardAfterHit.points[3].count).toBe(1);
    expect(boardAfterHit.bar.BLACK).toBe(1);
    expect(boardAfterHit.lockedHomeHitPoints).toContain(3);

    const movesWithDie2 = getLegalSingleMovesForDie(boardAfterHit, 'WHITE', 2);

    // 1. Hitting checker at 3 cannot move further
    expect(movesWithDie2.find((m) => m.from === 3)).toBeUndefined();
    // 2. Another checker at 5 cannot cover point 3
    expect(movesWithDie2.find((m) => m.to === 3)).toBeUndefined();
  });

  it('Default Rule: Hit inside home board allows covering (დაფარვა) and moving on next die', () => {
    const board = createEmptyBoard();

    board.points[6] = { owner: 'WHITE', count: 1 };
    board.points[3] = { owner: 'BLACK', count: 1 };
    board.points[4] = { owner: 'WHITE', count: 1 };

    const hitMove: SingleMove = {
      from: 6,
      to: 3,
      dieUsed: 3,
      isHit: true,
      isHomeBoardHit: true,
    };

    // By default forbidHitAndHideInHome is false (hitting and covering is allowed!)
    const boardAfterHit = applySingleMove(board, 'WHITE', hitMove, false);

    expect(boardAfterHit.lockedHomeHitPoints.length).toBe(0);

    const movesWithDie1 = getLegalSingleMovesForDie(boardAfterHit, 'WHITE', 1);

    // 1. Checker at 4 CAN cover the hit checker at 3 (4 - 1 = 3)!
    expect(movesWithDie1.find((m) => m.from === 4 && m.to === 3)).toBeDefined();
    // 2. Hitting checker at 3 CAN move forward to 2 (3 - 1 = 2)!
    expect(movesWithDie1.find((m) => m.from === 3 && m.to === 2)).toBeDefined();
  });

  it('Georgian Rule: Allows hitting in own home board even if locking prevents using the second die', () => {
    const board = createEmptyBoard();
    // WHITE has only 1 movable checker at point 5 (home board), rest borne off (14)
    board.points[5] = { owner: 'WHITE', count: 1 };
    board.borneOff.WHITE = 14;
    // BLACK has a blot at point 3 (inside WHITE home board)
    board.points[3] = { owner: 'BLACK', count: 1 };
    board.borneOff.BLACK = 14;

    // Roll is [2, 1].
    // Non-hitting sequence: 5 -> 4 (die 1) -> 2 (die 2) uses 2 dice.
    // Hitting sequence: 5 -> 3 (die 2, hits BLACK in home board, locks 3, so die 1 burns) uses 1 die.
    // Both MUST be allowed so player can choose to hit in home board!
    const sequences = generateLegalTurnSequences(board, 'WHITE', [2, 1], true);
    const hasHomeHitSeq = sequences.some(
      (s) => s.moves[0].from === 5 && s.moves[0].to === 3 && s.moves[0].isHomeBoardHit
    );
    const hasNonHitSeq = sequences.some(
      (s) => s.moves[0].from === 5 && s.moves[0].to === 4
    );

    expect(hasHomeHitSeq).toBe(true);
    expect(hasNonHitSeq).toBe(true);
  });

  it('Preserves both dice orders when moving a single checker so UI allows either first step', () => {
    const board = createEmptyBoard();
    board.points[12] = { owner: 'WHITE', count: 1 };

    const sequences = generateLegalTurnSequences(board, 'WHITE', [4, 2]);
    const firstTargets = sequences.map((s) => s.moves[0].to);

    // Both 12->8 (die 4 first) and 12->10 (die 2 first) must be present!
    expect(firstTargets).toContain(8);
    expect(firstTargets).toContain(10);
  });

  it('Hit outside own home board does NOT lock the point', () => {
    const board = createEmptyBoard();
    board.points[15] = { owner: 'WHITE', count: 1 };
    board.points[12] = { owner: 'BLACK', count: 1 };

    const hitMove: SingleMove = {
      from: 15,
      to: 12,
      dieUsed: 3,
      isHit: true,
      isHomeBoardHit: false,
    };

    const boardAfterHit = applySingleMove(board, 'WHITE', hitMove);
    expect(boardAfterHit.lockedHomeHitPoints.length).toBe(0);

    const movesWithDie2 = getLegalSingleMovesForDie(boardAfterHit, 'WHITE', 2);
    expect(movesWithDie2.find((m) => m.from === 12 && m.to === 10)).toBeDefined();
  });

  it('Must enter from BAR before moving any board checker', () => {
    const board = createEmptyBoard();
    board.bar.WHITE = 1;
    board.points[10] = { owner: 'WHITE', count: 2 };

    const moves = getLegalSingleMovesForDie(board, 'WHITE', 4);
    expect(moves.length).toBe(1);
    expect(moves[0].from).toBe('BAR');
    expect(moves[0].to).toBe(20);
  });

  it('Higher die rule: if only one die can be played, the higher die is mandatory', () => {
    const board = createEmptyBoard();
    board.points[10] = { owner: 'WHITE', count: 1 };
    board.points[4] = { owner: 'BLACK', count: 2 };
    board.points[1] = { owner: 'BLACK', count: 2 };
    board.points[2] = { owner: 'BLACK', count: 2 };

    const sequences = generateLegalTurnSequences(board, 'WHITE', [5, 3]);
    expect(sequences.length).toBeGreaterThan(0);
    for (const seq of sequences) {
      expect(seq.moves.length).toBe(1);
      expect(seq.moves[0].dieUsed).toBe(5);
    }
  });

  it('Bear-off: only allowed when all checkers are in home board and over-roll requires no checkers behind', () => {
    const board = createEmptyBoard();
    board.points[1] = { owner: 'WHITE', count: 2 };
    board.points[4] = { owner: 'WHITE', count: 1 };

    expect(canBearOff(board, 'WHITE')).toBe(true);

    const movesWithDie6 = getLegalSingleMovesForDie(board, 'WHITE', 6);
    expect(movesWithDie6.find((m) => m.from === 4 && m.to === 'OFF')).toBeDefined();
    expect(movesWithDie6.find((m) => m.from === 1 && m.to === 'OFF')).toBeUndefined();
  });

  it('Koksi (3x) detection when loser has 0 borne off and a checker on bar or in winner home', () => {
    const board = createEmptyBoard();
    board.borneOff.WHITE = 15;
    board.borneOff.BLACK = 0;
    board.points[3] = { owner: 'BLACK', count: 1 }; // Inside WHITE home board (0..5)
    board.points[20] = { owner: 'BLACK', count: 14 };

    expect(isKoksiLoss(board, 'BLACK')).toBe(true);

    // Move BLACK checker out of WHITE home board to point 10 -> regular Mars, not Koksi
    board.points[3] = { owner: null, count: 0 };
    board.points[10] = { owner: 'BLACK', count: 1 };
    expect(isKoksiLoss(board, 'BLACK')).toBe(false);
  });
});
