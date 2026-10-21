import { describe, expect, it } from 'vitest';
import { BoardState, Player } from './types';
import {
  applySingleMove,
  canBearOff,
  cloneBoard,
  generateLegalTurnSequences,
  isRoundWon,
} from './rules';
import { chooseBestMoveSequence } from './ai';

describe('Auto-Play & Bear-Off Engine', () => {
  it('correctly bears off all checkers to completion when White is in home board', () => {
    // Create a board where White has all remaining 8 checkers in home board (points 0..5)
    const points = Array.from({ length: 24 }, () => ({
      owner: null as Player | null,
      count: 0,
    }));

    // White home board is 0..5
    points[0] = { owner: 'WHITE', count: 2 };
    points[1] = { owner: 'WHITE', count: 2 };
    points[2] = { owner: 'WHITE', count: 2 };
    points[3] = { owner: 'WHITE', count: 2 };

    // Black has 4 checkers on 20..23 (their home)
    points[20] = { owner: 'BLACK', count: 2 };
    points[21] = { owner: 'BLACK', count: 2 };

    let board: BoardState = {
      points,
      bar: { WHITE: 0, BLACK: 0 },
      borneOff: { WHITE: 7, BLACK: 11 },
      lockedHomeHitPoints: [],
    };

    expect(canBearOff(board, 'WHITE')).toBe(true);

    let turnsCount = 0;
    while (!isRoundWon(board, 'WHITE') && turnsCount < 50) {
      turnsCount++;
      // Roll random dice
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];

      const sequences = generateLegalTurnSequences(board, 'WHITE', dice, false);
      expect(sequences.length).toBeGreaterThan(0);

      const bestSeq = chooseBestMoveSequence(board, 'WHITE', sequences, 'GRANDMASTER');
      expect(bestSeq).not.toBeNull();
      expect(bestSeq!.moves.length).toBeGreaterThan(0);

      let currentB = board;
      for (const m of bestSeq!.moves) {
        currentB = applySingleMove(currentB, 'WHITE', m, false);
      }

      board = { ...currentB, lockedHomeHitPoints: [] };
    }

    expect(isRoundWon(board, 'WHITE')).toBe(true);
    expect(board.borneOff.WHITE).toBe(15);
  });

  it('multi-die turn execution simulates auto-play loop without halting or dropping moves', () => {
    // Test a roll of [6, 4] for White in home board
    const points = Array.from({ length: 24 }, () => ({
      owner: null as Player | null,
      count: 0,
    }));
    points[5] = { owner: 'WHITE', count: 2 }; // point 6
    points[3] = { owner: 'WHITE', count: 2 }; // point 4

    let board: BoardState = {
      points,
      bar: { WHITE: 0, BLACK: 0 },
      borneOff: { WHITE: 11, BLACK: 0 },
      lockedHomeHitPoints: [],
    };

    const dice = [6, 4];
    const sequences = generateLegalTurnSequences(board, 'WHITE', dice, false);
    const best = chooseBestMoveSequence(board, 'WHITE', sequences, 'GRANDMASTER');

    expect(best).not.toBeNull();
    // Both dice must be played!
    expect(best!.moves.length).toBe(2);

    // Apply moves sequentially as the auto-play loop does
    let currentB = board;
    const currentDice = [...dice];
    for (const m of best!.moves) {
      currentB = applySingleMove(currentB, 'WHITE', m, false);
      const idx = currentDice.indexOf(m.dieUsed);
      expect(idx).not.toBe(-1);
      currentDice.splice(idx, 1);
    }

    // Both dice should be consumed
    expect(currentDice.length).toBe(0);
    // Borne off should have increased by 2
    expect(currentB.borneOff.WHITE).toBe(13);
  });
});
