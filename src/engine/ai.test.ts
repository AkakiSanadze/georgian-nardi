import { describe, expect, it } from 'vitest';
import { createInitialBoard } from './constants';
import { generateLegalTurnSequences } from './rules';
import { chooseBestMoveSequence, isPureRace, evaluateBoard, shouldAIOfferDavi } from './ai';
import { BoardState, Player } from './types';

describe('AI Decision Engine & Tactical Tests', () => {
  it('correctly detects pure race vs contact positions', () => {
    const initialBoard = createInitialBoard();
    expect(isPureRace(initialBoard)).toBe(false);

    // Create a pure race board where all White checkers are <= 5 and all Black checkers are >= 18
    const points = Array.from({ length: 24 }, () => ({
      owner: null as Player | null,
      count: 0,
    }));
    points[2] = { owner: 'WHITE', count: 5 };
    points[20] = { owner: 'BLACK', count: 5 };

    const raceBoard: BoardState = {
      points,
      bar: { WHITE: 0, BLACK: 0 },
      borneOff: { WHITE: 10, BLACK: 10 },
      lockedHomeHitPoints: [],
    };

    expect(isPureRace(raceBoard)).toBe(true);
  });

  it('bears off maximum checkers in pure race instead of avoiding odd checker counts', () => {
    const points = Array.from({ length: 24 }, () => ({
      owner: null as Player | null,
      count: 0,
    }));
    points[18] = { owner: 'BLACK', count: 2 };
    points[19] = { owner: 'BLACK', count: 2 };
    points[0] = { owner: 'WHITE', count: 2 };

    const board: BoardState = {
      points,
      bar: { WHITE: 0, BLACK: 0 },
      borneOff: { WHITE: 13, BLACK: 11 },
      lockedHomeHitPoints: [],
    };

    const sequences = generateLegalTurnSequences(board, 'BLACK', [6, 5], false);
    const chosen = chooseBestMoveSequence(board, 'BLACK', sequences, 'GRANDMASTER');

    expect(chosen).not.toBeNull();
    const bearOffMoves = chosen!.moves.filter((m) => m.to === 'OFF');
    expect(bearOffMoves.length).toBe(2);
  });

  it('plays the optimal 5-point (golden point) make on opening 3-1 roll for Black', () => {
    const board = createInitialBoard();
    const sequences = generateLegalTurnSequences(board, 'BLACK', [3, 1], false);
    const chosen = chooseBestMoveSequence(board, 'BLACK', sequences, 'GRANDMASTER');

    expect(chosen).not.toBeNull();
    // In standard backgammon, 3-1 for Black makes point 19 (5-point) via 16->19 and 18->19
    const toPoints = chosen!.moves.map((m) => m.to);
    expect(toPoints).toContain(19);
  });

  it('evaluates higher board scores when holding key strategic points', () => {
    const board = createInitialBoard();
    const scoreBase = evaluateBoard(board, 'BLACK', 'GRANDMASTER');

    // Create a board where Black made the golden point (point 19)
    const improvedBoard = createInitialBoard();
    improvedBoard.points[16].count -= 1;
    improvedBoard.points[18].count -= 1;
    improvedBoard.points[19] = { owner: 'BLACK', count: 2 };

    const scoreImproved = evaluateBoard(improvedBoard, 'BLACK', 'GRANDMASTER');
    expect(scoreImproved).toBeGreaterThan(scoreBase);
  });

  it('runs successfully on the exact screenshot board position for Black', () => {
    const points = Array.from({ length: 24 }, () => ({
      owner: null as Player | null,
      count: 0,
    }));
    // White:
    points[22] = { owner: 'WHITE', count: 2 };
    points[7] = { owner: 'WHITE', count: 2 };
    points[5] = { owner: 'WHITE', count: 2 };
    points[4] = { owner: 'WHITE', count: 2 };
    points[3] = { owner: 'WHITE', count: 2 };
    points[2] = { owner: 'WHITE', count: 4 };

    // Black:
    points[1] = { owner: 'BLACK', count: 2 };
    points[15] = { owner: 'BLACK', count: 1 };
    points[18] = { owner: 'BLACK', count: 2 };
    points[19] = { owner: 'BLACK', count: 2 };
    points[20] = { owner: 'BLACK', count: 3 };
    points[21] = { owner: 'BLACK', count: 2 };
    points[23] = { owner: 'BLACK', count: 3 };

    const board: BoardState = {
      points,
      bar: { WHITE: 1, BLACK: 0 },
      borneOff: { WHITE: 0, BLACK: 0 },
      lockedHomeHitPoints: [],
    };

    // Test for various dice rolls
    for (const roll of [[6, 6], [5, 5], [4, 4], [3, 3], [2, 2], [1, 1], [6, 5], [4, 2], [3, 1], [2, 1]]) {
      const dice = roll[0] === roll[1] ? [roll[0], roll[0], roll[0], roll[0]] : roll;
      const seqs = generateLegalTurnSequences(board, 'BLACK', dice, false);
      const chosen = chooseBestMoveSequence(board, 'BLACK', seqs, 'GRANDMASTER');
      if (seqs.length > 0) {
        expect(chosen).not.toBeNull();
      }
    }

    const daviOffer = shouldAIOfferDavi(
      board,
      'BLACK',
      { level: 0, value: 1, owner: null, offeredBy: null, offeredValue: 2 },
      { WHITE: 0, BLACK: 0, targetScore: 5, roundNumber: 1, isCrawford: false, crawfordPassed: false },
      'SKILLED'
    );
    expect(typeof daviOffer).toBe('boolean');
  });
});


