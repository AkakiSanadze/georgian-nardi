import { describe, expect, it } from 'vitest';
import { createInitialBoard } from './constants';
import {
  applySingleMove,
  generateLegalTurnSequences,
  getLegalSingleMovesForDie,
  isRoundWon,
} from './rules';
import { chooseBestMoveSequence } from './ai';
import { BoardState, Player } from './types';

describe('Full Game Simulations & Invariants', () => {
  it('Simulates multiple full games without illegal states or infinite loops', () => {
    for (let gameIdx = 0; gameIdx < 3; gameIdx++) {
      let board: BoardState = createInitialBoard();
      let turn: Player = 'WHITE';
      let gameOver = false;
      let roundTurns = 0;

      while (!gameOver && roundTurns < 300) {
        roundTurns++;
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const dice = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];

        // 1. Verify checker totals before move: exactly 15 for each player
        let whiteTotal = board.bar.WHITE + board.borneOff.WHITE;
        let blackTotal = board.bar.BLACK + board.borneOff.BLACK;
        for (let i = 0; i < 24; i++) {
          if (board.points[i].owner === 'WHITE') whiteTotal += board.points[i].count;
          if (board.points[i].owner === 'BLACK') blackTotal += board.points[i].count;
        }
        expect(whiteTotal).toBe(15);
        expect(blackTotal).toBe(15);

        const sequences = generateLegalTurnSequences(board, turn, dice);

        if (sequences.length > 0) {
          const chosen = chooseBestMoveSequence(board, turn, sequences, 'AMATEUR');
          expect(chosen).not.toBeNull();

          if (chosen) {
            for (const move of chosen.moves) {
              board = applySingleMove(board, turn, move);
              if (isRoundWon(board, turn)) {
                gameOver = true;
                break;
              }
            }
          }
        }

        // Clean turn locks
        board = { ...board, lockedHomeHitPoints: [] };
        turn = turn === 'WHITE' ? 'BLACK' : 'WHITE';
      }

      expect(gameOver).toBe(true);
      expect(board.borneOff.WHITE === 15 || board.borneOff.BLACK === 15).toBe(true);
    }
  });

  it('Verifies single-move click-to-move flow consistency with full sequence validity', () => {
    const board = createInitialBoard();
    // Test that for starting board and roll [3, 1], getLegalSingleMovesForDie matches legal start moves
    const moves3 = getLegalSingleMovesForDie(board, 'WHITE', 3);
    const moves1 = getLegalSingleMovesForDie(board, 'WHITE', 1);

    expect(moves3.length).toBeGreaterThan(0);
    expect(moves1.length).toBeGreaterThan(0);

    // Initial white checkers are at indices 23 (2), 12 (5), 7 (3), 5 (5)
    // 23 - 3 = 20 (legal)
    // 12 - 3 = 9 (legal)
    // 7 - 3 = 4 (legal)
    // 5 - 3 = 2 (legal)
    const froms3 = moves3.map((m) => m.from);
    expect(froms3).toContain(23);
    expect(froms3).toContain(12);
    expect(froms3).toContain(7);
    expect(froms3).toContain(5);
  });
});
