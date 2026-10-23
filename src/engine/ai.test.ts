import { describe, expect, it } from 'vitest';
import { createInitialBoard } from './constants';
import { generateLegalTurnSequences } from './rules';
import { chooseBestMoveSequence, isPureRace, evaluateBoard } from './ai';
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
});
