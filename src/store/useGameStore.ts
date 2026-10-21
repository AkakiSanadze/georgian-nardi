import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AIDifficulty,
  BoardState,
  CampaignRound,
  DaviLevel,
  DaviState,
  GameMode,
  GamePhase,
  GameSettings,
  GameStats,
  MatchScore,
  MoveSequence,
  Player,
  RoundResult,
  SingleMove,
} from '../engine/types';
import {
  CAMPAIGN_ROUNDS,
  createInitialBoard,
  DEFAULT_SETTINGS,
  DEFAULT_STATS,
  getGeorgianDiceName,
} from '../engine/constants';
import {
  applySingleMove,
  cloneBoard,
  generateLegalTurnSequences,
  getOpponent,
  isKoksiLoss,
  isRoundWon,
} from '../engine/rules';
import {
  chooseBestMoveSequence,
  shouldAIAcceptDavi,
  shouldAIOfferDavi,
} from '../engine/ai';
import { sounds } from '../audio/soundEngine';
import { haptics } from '../audio/haptics';

const STORAGE_KEY_CAMPAIGN = 'georgian_nardi_campaign_unlocked';
const STORAGE_KEY_SETTINGS = 'georgian_nardi_settings';
const STORAGE_KEY_STATS = 'georgian_nardi_stats';

export interface UndoStep {
  board: BoardState;
  diceRemaining: number[];
  move: SingleMove;
}

export function useGameStore() {
  // Persistence
  const [unlockedCampaignRound, setUnlockedCampaignRound] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGN);
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      return saved
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved), allowHitAndCoverInHome: true }
        : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      return saved ? { ...DEFAULT_STATS, ...JSON.parse(saved) } : DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  // Save stats to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch (e) {
      console.error(e);
    }
  }, [stats]);

  // Synchronize sound and haptic settings on mount & whenever updated
  useEffect(() => {
    sounds.setMuted(!settings.soundEnabled);
    sounds.setVolume(settings.soundVolume);
    haptics.setEnabled(settings.hapticFeedbackEnabled ?? true);
  }, [settings.soundEnabled, settings.soundVolume, settings.hapticFeedbackEnabled]);

  // Save settings
  const updateSettings = (newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      sounds.setMuted(!updated.soundEnabled);
      sounds.setVolume(updated.soundVolume);
      haptics.setEnabled(updated.hapticFeedbackEnabled ?? true);
      return updated;
    });
  };

  // Game setup
  const [gameMode, setGameMode] = useState<GameMode>('CAMPAIGN');
  const [currentCampaignRound, setCurrentCampaignRound] = useState<CampaignRound>(
    CAMPAIGN_ROUNDS[0]
  );
  const [quickDifficulty, setQuickDifficulty] = useState<AIDifficulty>('SKILLED');
  const [quickTargetScore, setQuickTargetScore] = useState<number>(5);

  // Live game state
  const [board, setBoard] = useState<BoardState>(createInitialBoard());
  const [turn, setTurn] = useState<Player>('WHITE');
  const [phase, setPhase] = useState<GamePhase>('WAITING_FOR_ROLL_OR_DAVI');

  // Dice
  const [dice, setDice] = useState<[number, number] | null>(null);
  const [diceRemaining, setDiceRemaining] = useState<number[]>([]);
  const [diceName, setDiceName] = useState<string>('');
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollKey, setRollKey] = useState<number>(0);

  // Davi
  const [daviState, setDaviState] = useState<DaviState>({
    level: 0,
    value: 1,
    owner: null,
    offeredBy: null,
    offeredValue: 1,
  });

  // Match score
  const [matchScore, setMatchScore] = useState<MatchScore>({
    WHITE: 0,
    BLACK: 0,
    targetScore: 3,
    roundNumber: 1,
    isCrawford: false,
    crawfordPassed: false,
  });

  // Selection & Moves
  const [selectedPoint, setSelectedPoint] = useState<number | 'BAR' | null>(null);
  const [legalTargets, setLegalTargets] = useState<number[]>([]);
  const [undoStack, setUndoStack] = useState<UndoStep[]>([]);
  const [hintSequence, setHintSequence] = useState<MoveSequence | null>(null);
  const [turnCompletedWaitingConfirm, setTurnCompletedWaitingConfirm] = useState<boolean>(false);

  // Result
  const [lastRoundResult, setLastRoundResult] = useState<RoundResult | null>(null);
  const [historyLog, setHistoryLog] = useState<string[]>([]);

  // Ref to track latest state inside async AI timeouts
  const stateRef = useRef({
    board,
    turn,
    phase,
    diceRemaining,
    daviState,
    matchScore,
    gameMode,
    currentCampaignRound,
    unlockedCampaignRound,
    quickDifficulty,
    settings,
  });

  useEffect(() => {
    stateRef.current = {
      board,
      turn,
      phase,
      diceRemaining,
      daviState,
      matchScore,
      gameMode,
      currentCampaignRound,
      unlockedCampaignRound,
      quickDifficulty,
      settings,
    };
  });

  const addLog = useCallback((msg: string) => {
    setHistoryLog((prev) => [msg, ...prev.slice(0, 45)]);
  }, []);

  /**
   * Cryptographically fair dice roller (1..6).
   */
  const rollFairDie = (): number => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (array[0] % 6) + 1;
  };

  /**
   * Starts a brand new match.
   */
  const startNewMatch = (
    mode: GameMode,
    campaignRoundIndex = 0,
    difficulty: AIDifficulty = 'SKILLED',
    targetScore = 5
  ) => {
    setGameMode(mode);
    const roundConfig = CAMPAIGN_ROUNDS[campaignRoundIndex] || CAMPAIGN_ROUNDS[0];
    setCurrentCampaignRound(roundConfig);
    setQuickDifficulty(difficulty);
    setQuickTargetScore(targetScore);

    const actualTarget = mode === 'CAMPAIGN' ? roundConfig.targetScore : targetScore;

    setMatchScore({
      WHITE: 0,
      BLACK: 0,
      targetScore: actualTarget,
      roundNumber: 1,
      isCrawford: false,
      crawfordPassed: false,
    });

    startNewRound('WHITE', mode);

    addLog(`ახალი მატჩი დაიწყო! მიზანი: ${actualTarget} ქულა.`);
  };

  /**
   * Starts a new round within the current match.
   * By default, winner of the last round starts (or WHITE on round 1).
   */
  const startNewRound = (starter?: Player, modeOverride?: GameMode) => {
    const effectiveStarter = starter || lastRoundResult?.winner || 'WHITE';
    const effectiveMode = modeOverride || gameMode;

    setBoard(createInitialBoard());
    setTurn(effectiveStarter);
    setDice(null);
    setDiceRemaining([]);
    setDiceName('');
    setSelectedPoint(null);
    setLegalTargets([]);
    setUndoStack([]);
    setHintSequence(null);
    setTurnCompletedWaitingConfirm(false);
    setLastRoundResult(null);

    setDaviState({
      level: 0,
      value: 1,
      owner: null,
      offeredBy: null,
      offeredValue: 1,
    });

    if (effectiveMode !== 'PASS_AND_PLAY' && effectiveStarter === 'BLACK') {
      setPhase('AI_THINKING');
    } else {
      setPhase('WAITING_FOR_ROLL_OR_DAVI');
    }
  };

  /**
   * Helper: Given current board, player, dice, and a source point (`fromPoint`),
   * derives all valid single-step and multi-step chains for that checker
   * strictly from `generateLegalTurnSequences`!
   * This guarantees 100% compliance with Maximum Dice, Higher Die, and Georgian Home-Board Hit Lock rules.
   */
  const getValidChainsFromPoint = (
    currentBoard: BoardState,
    activePlayer: Player,
    currentDice: number[],
    fromPoint: number | 'BAR'
  ): Map<number, SingleMove[]> => {
    const targetToChain = new Map<number, SingleMove[]>();
    const forbidLock = !settings.allowHitAndCoverInHome;
    const legalSequences = generateLegalTurnSequences(
      currentBoard,
      activePlayer,
      currentDice,
      forbidLock
    );

    for (const seq of legalSequences) {
      if (seq.moves.length === 0) continue;
      if (seq.moves[0].from !== fromPoint) continue;

      const chain: SingleMove[] = [];
      let expectedNextFrom: number | 'BAR' = fromPoint;

      for (const m of seq.moves) {
        if (m.from !== expectedNextFrom) break;
        chain.push(m);
        const targetKey = m.to === 'OFF' ? -99 : m.to;

        // Keep the shortest chain to reach this target (so single-die move is preferred for 1-step target)
        const existing = targetToChain.get(targetKey);
        if (!existing || chain.length < existing.length) {
          targetToChain.set(targetKey, [...chain]);
        }

        if (m.to === 'OFF') break;
        expectedNextFrom = m.to;
      }
    }

    return targetToChain;
  };

  /**
   * Computes which source points currently have at least one legal move.
   */
  const getMovableSourcePoints = useCallback(
    (currentBoard: BoardState, activePlayer: Player, currentDice: number[]): Set<number | 'BAR'> => {
      const movable = new Set<number | 'BAR'>();
      if (currentDice.length === 0) return movable;
      const forbidLock = !settings.allowHitAndCoverInHome;
      const legalSequences = generateLegalTurnSequences(
        currentBoard,
        activePlayer,
        currentDice,
        forbidLock
      );
      for (const seq of legalSequences) {
        if (seq.moves.length > 0) {
          movable.add(seq.moves[0].from);
        }
      }
      return movable;
    },
    [settings.allowHitAndCoverInHome]
  );

  /**
   * Executes dice roll for the current player.
   */
  const rollDice = () => {
    if (phase !== 'WAITING_FOR_ROLL_OR_DAVI' || isRolling) return;

    // Immediately generate cryptographically fair dice so 3D animation knows where to land!
    const d1 = rollFairDie();
    const d2 = rollFairDie();
    const diceArr = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
    const georgianName = getGeorgianDiceName(d1, d2);

    setDice([d1, d2]);
    setRollKey((prev) => prev + 1);
    setIsRolling(true);
    setTurnCompletedWaitingConfirm(false);
    sounds.playDiceRoll();
    haptics.trigger('medium');

    const rollingBoard = board;
    const rollingPlayer = turn;

    setTimeout(() => {
      setDiceRemaining(diceArr);
      setDiceName(georgianName);
      setIsRolling(false);

      // Record stat
      const high = Math.max(d1, d2);
      const low = Math.min(d1, d2);
      const key = `${high}-${low}`;
      setStats((prev) => ({
        ...prev,
        diceRollsCount: {
          ...prev.diceRollsCount,
          [key]: (prev.diceRollsCount[key] || 0) + 1,
        },
      }));

      const playerName = rollingPlayer === 'WHITE' ? 'თეთრმა' : 'შავმა';
      addLog(`${playerName} გააგორა: ${d1}-${d2} (${georgianName})`);

      // Check legal sequences
      const sequences = generateLegalTurnSequences(
        rollingBoard,
        rollingPlayer,
        diceArr,
        !settings.allowHitAndCoverInHome
      );

      if (sequences.length === 0) {
        addLog(`⚠️ ${playerName} სვლა არ აქვს! სვლა გადადის.`);
        setTimeout(() => {
          endTurn(rollingBoard, rollingPlayer);
        }, 1200);
      } else {
        setPhase('MOVING');
        // If player has checkers on the BAR, auto-select BAR for convenience!
        if (rollingBoard.bar[rollingPlayer] > 0) {
          const chains = getValidChainsFromPoint(rollingBoard, rollingPlayer, diceArr, 'BAR');
          if (chains.size > 0) {
            setSelectedPoint('BAR');
            setLegalTargets(Array.from(chains.keys()));
          }
        }
      }
    }, 750);
  };

  /**
   * Selects a point/bar and computes available target points.
   */
  const handleSelectPoint = (point: number | 'BAR') => {
    if (phase !== 'MOVING' || turnCompletedWaitingConfirm) return;
    if (gameMode !== 'PASS_AND_PLAY' && turn !== 'WHITE') return;

    // 1. If a checker is already selected, and the clicked point is a legal target:
    if (selectedPoint !== null && typeof point === 'number' && legalTargets.includes(point)) {
      executePlayerMove(selectedPoint, point);
      return;
    }

    // 2. If clicking on the currently selected point, deselect it
    if (selectedPoint === point) {
      setSelectedPoint(null);
      setLegalTargets([]);
      return;
    }

    // 3. Otherwise, check if this point has player's checkers and can be selected as new source
    if (point === 'BAR') {
      if (board.bar[turn] === 0) return;
    } else {
      if (board.points[point].owner !== turn || board.points[point].count === 0) {
        return;
      }
      if (!settings.allowHitAndCoverInHome && board.lockedHomeHitPoints.includes(point)) {
        addLog('🔒 ეს ქვა საკუთარ კარში მოკვლის გამო ამ სვლაზე ჩაკეტილია!');
        return;
      }
    }

    // If player has checkers on BAR, they MUST select BAR!
    if (board.bar[turn] > 0 && point !== 'BAR') {
      addLog('⚠️ ჯერ ბარიდან უნდა შემოიყვანო მოკლული ქვა!');
      const barChains = getValidChainsFromPoint(board, turn, diceRemaining, 'BAR');
      setSelectedPoint('BAR');
      setLegalTargets(Array.from(barChains.keys()));
      return;
    }

    // Compute strictly valid targets for this selected checker
    const chains = getValidChainsFromPoint(board, turn, diceRemaining, point);
    if (chains.size === 0) {
      addLog('ამ ქვით კანონიერი სვლა არ კეთდება.');
      return;
    }

    // Single-tap smart move: if only 1 target is available, execute immediately!
    if (settings.singleTapMoveEnabled && chains.size === 1) {
      const onlyTargetKey = Array.from(chains.keys())[0];
      executePlayerMove(point, onlyTargetKey === -99 ? 'OFF' : onlyTargetKey);
      return;
    }

    setSelectedPoint(point);
    setLegalTargets(Array.from(chains.keys()));
    sounds.playClick();
    haptics.trigger('selection');
  };

  /**
   * Double-click handler: immediately plays the best/highest single-die move for that checker!
   */
  const handleDoubleClickPoint = (point: number | 'BAR') => {
    if (phase !== 'MOVING' || turnCompletedWaitingConfirm) return;
    if (gameMode !== 'PASS_AND_PLAY' && turn !== 'WHITE') return;

    const chains = getValidChainsFromPoint(board, turn, diceRemaining, point);
    if (chains.size === 0) return;

    // Prefer bearing off (-99) if available, otherwise pick the single-step move with the highest die
    if (chains.has(-99)) {
      executePlayerMove(point, 'OFF');
      return;
    }

    let bestTarget: number | null = null;
    let bestDie = -1;

    for (const [targetKey, chain] of chains.entries()) {
      if (chain.length === 1 && chain[0].dieUsed > bestDie) {
        bestDie = chain[0].dieUsed;
        bestTarget = targetKey;
      }
    }

    if (bestTarget !== null) {
      executePlayerMove(point, bestTarget);
    }
  };

  /**
   * Executes a move from `from` to `to` (supports 1, 2, 3, or 4 combined moves!).
   */
  const executePlayerMove = (from: number | 'BAR', to: number | 'OFF') => {
    if (phase !== 'MOVING') return;

    const targetKey = to === 'OFF' ? -99 : to;
    const chains = getValidChainsFromPoint(board, turn, diceRemaining, from);
    const chosenChain = chains.get(targetKey);

    if (!chosenChain || chosenChain.length === 0) {
      return;
    }

    let currentB = board;
    let currentDice = [...diceRemaining];
    const newUndoSteps: UndoStep[] = [];

    for (let idx = 0; idx < chosenChain.length; idx++) {
      const m = chosenChain[idx];
      newUndoSteps.push({
        board: cloneBoard(currentB),
        diceRemaining: [...currentDice],
        move: m,
      });

      currentB = applySingleMove(currentB, turn, m, !settings.allowHitAndCoverInHome);
      const dieIdx = currentDice.indexOf(m.dieUsed);
      if (dieIdx !== -1) {
        currentDice.splice(dieIdx, 1);
      }

      if (idx === 0) {
        playMoveSoundAndLog(m);
      } else {
        setTimeout(() => playMoveSoundAndLog(m), idx * 160);
      }
    }

    setUndoStack((prev) => [...prev, ...newUndoSteps]);
    setHintSequence(null);
    commitPlayerBoardChange(currentB, currentDice);
  };

  const playMoveSoundAndLog = (m: SingleMove) => {
    if (m.to === 'OFF') {
      sounds.playBearOff();
      haptics.trigger('light');
    } else if (m.isHit) {
      sounds.playCheckerHit();
      haptics.trigger('heavy');
    } else {
      sounds.playCheckerMove();
      haptics.trigger('light');
    }

    if (m.isHomeBoardHit && !settings.allowHitAndCoverInHome) {
      addLog(
        `🔒 ქვა მოიკლა საკუთარ კარში (${(m.to as number) + 1}-ე უჯრა)! ქართული წესით ის ამ სვლაზე ღიად რჩება.`
      );
    } else if (m.isHit) {
      addLog(`💥 ქვა მოიკლა ${(m.to as number) + 1}-ე უჯრაზე და გაიგზავნა ბარზე!`);
    }
  };

  /**
   * Applies the updated board and dice, and checks for turn completion or victory.
   */
  const commitPlayerBoardChange = (nextBoard: BoardState, nextDice: number[]) => {
    setBoard(nextBoard);
    setDiceRemaining(nextDice);
    setSelectedPoint(null);
    setLegalTargets([]);

    // Check round victory
    if (isRoundWon(nextBoard, turn)) {
      handleRoundVictory(nextBoard, turn);
      return;
    }

    // Check if further moves are possible
    if (nextDice.length === 0) {
      if (settings.autoConfirmTurn) {
        setTimeout(() => endTurn(nextBoard, turn), 350);
      } else {
        setTurnCompletedWaitingConfirm(true);
        addLog('✅ სვლა დასრულებულია — დააჭირე „დადასტურებას“ (ან Space) ან დააბრუნე სვლა (Undo).');
      }
    } else {
      const remainingSequences = generateLegalTurnSequences(
        nextBoard,
        turn,
        nextDice,
        !settings.allowHitAndCoverInHome
      );
      if (remainingSequences.length === 0) {
        addLog('⚠️ დარჩენილი კამათლებით სვლა აღარ არის.');
        if (settings.autoConfirmTurn) {
          setTimeout(() => endTurn(nextBoard, turn), 500);
        } else {
          setTurnCompletedWaitingConfirm(true);
        }
      } else if (nextBoard.bar[turn] > 0) {
        // Still have a checker on BAR: auto-select BAR for the next die!
        const barChains = getValidChainsFromPoint(nextBoard, turn, nextDice, 'BAR');
        if (barChains.size > 0) {
          setSelectedPoint('BAR');
          setLegalTargets(Array.from(barChains.keys()));
        }
      }
    }
  };

  /**
   * Explicitly confirms the end of player turn.
   */
  const handleConfirmTurn = () => {
    if (!turnCompletedWaitingConfirm) return;
    setTurnCompletedWaitingConfirm(false);
    endTurn(board, turn);
  };

  /**
   * Reverts the last single move made in the current turn.
   */
  const handleUndo = () => {
    if (undoStack.length === 0 || phase !== 'MOVING') return;

    const lastStep = undoStack[undoStack.length - 1];
    setBoard(lastStep.board);
    setDiceRemaining(lastStep.diceRemaining);
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setSelectedPoint(null);
    setLegalTargets([]);
    setTurnCompletedWaitingConfirm(false);
    sounds.playClick();
    addLog('↩️ სვლა დაბრუნდა.');
  };

  /**
   * Requests an AI Hint for the current position.
   */
  const handleRequestHint = () => {
    if (phase !== 'MOVING' || diceRemaining.length === 0) return;
    const sequences = generateLegalTurnSequences(
      board,
      turn,
      diceRemaining,
      !settings.allowHitAndCoverInHome
    );
    if (sequences.length === 0) return;

    const best = chooseBestMoveSequence(board, turn, sequences, 'GRANDMASTER');
    if (best && best.moves.length > 0) {
      setHintSequence(best);
      // Also select that checker so the user can immediately click the target!
      const firstFrom = best.moves[0].from;
      const chains = getValidChainsFromPoint(board, turn, diceRemaining, firstFrom);
      setSelectedPoint(firstFrom);
      setLegalTargets(Array.from(chains.keys()));
      sounds.playClick();
      const fromText = firstFrom === 'BAR' ? 'ბარიდან' : `${firstFrom + 1}-ე უჯრიდან`;
      const toText =
        best.moves[0].to === 'OFF' ? 'გადაყრა' : `${(best.moves[0].to as number) + 1}-ე უჯრაზე`;
      addLog(`💡 AI კარნახი: ითამაშე ${fromText} → ${toText}`);
    }
  };

  /**
   * Ends current turn and switches to opponent.
   */
  const endTurn = (finalBoard: BoardState, completedTurnPlayer?: Player) => {
    const activeTurn = completedTurnPlayer || stateRef.current.turn;
    const activeMode = stateRef.current.gameMode;

    // Turn is complete: clear turn-specific home hit locks
    const cleanedBoard: BoardState = {
      ...finalBoard,
      lockedHomeHitPoints: [],
    };

    const nextTurn = getOpponent(activeTurn);
    setBoard(cleanedBoard);
    setTurn(nextTurn);
    setDice(null);
    setDiceRemaining([]);
    setDiceName('');
    setSelectedPoint(null);
    setLegalTargets([]);
    setUndoStack([]);
    setHintSequence(null);
    setTurnCompletedWaitingConfirm(false);

    // If it's AI's turn (in Campaign or Quick match), trigger AI pipeline
    if (activeMode !== 'PASS_AND_PLAY' && nextTurn === 'BLACK') {
      setPhase('AI_THINKING');
    } else {
      setPhase('WAITING_FOR_ROLL_OR_DAVI');
    }
  };

  /**
   * Davi offering and resolution.
   */
  const handleOfferDavi = (offeringPlayer: Player) => {
    const latestMatchScore = stateRef.current.matchScore;
    const latestDavi = stateRef.current.daviState;

    if (latestMatchScore.isCrawford) {
      addLog('კროუფორდის რაუნდში დავის თქმა აკრძალულია!');
      return;
    }
    if (latestDavi.owner !== null && latestDavi.owner !== offeringPlayer) {
      addLog('დავის თქმის უფლება მოწინააღმდეგეს აქვს!');
      return;
    }

    const nextLevel = (latestDavi.level + 1) as DaviLevel;
    const nextValue = nextLevel + 1; // 2, 3, 4, 5, 6

    setDaviState((prev) => ({
      ...prev,
      offeredBy: offeringPlayer,
      offeredValue: nextValue,
    }));
    setPhase('DAVI_OFFERED');
    sounds.playDaviCall();

    const daviWord =
      nextLevel === 1
        ? 'დავი'
        : nextLevel === 2
        ? 'სე'
        : nextLevel === 3
        ? 'ჩარი'
        : nextLevel === 4
        ? 'ბეში'
        : 'შაში';
    addLog(
      `📢 ${offeringPlayer === 'WHITE' ? 'თეთრმა' : 'შავმა'} თქვა „${daviWord}!“ (${nextValue} ქულა)`
    );
  };

  const handleAcceptDavi = () => {
    const latestDavi = stateRef.current.daviState;
    const latestTurn = stateRef.current.turn;
    const latestMode = stateRef.current.gameMode;

    if (!latestDavi.offeredBy) return;

    const acceptingPlayer = getOpponent(latestDavi.offeredBy);
    const newLevel = (latestDavi.level + 1) as DaviLevel;
    const newValue = newLevel + 1;

    setDaviState({
      level: newLevel,
      value: newValue,
      owner: acceptingPlayer, // Right to redouble transfers to acceptor
      offeredBy: null,
      offeredValue: newValue,
    });

    sounds.playDaviCall();
    addLog(
      `🤝 ${acceptingPlayer === 'WHITE' ? 'თეთრმა' : 'შავმა'} მიიღო დავი! ფსონი გაიზარდა ${newValue}-მდე.`
    );

    // FIX: If it was AI's turn when AI offered Davi, resume AI_THINKING so AI rolls its dice!
    if (latestMode !== 'PASS_AND_PLAY' && latestTurn === 'BLACK') {
      setPhase('AI_THINKING');
    } else {
      setPhase('WAITING_FOR_ROLL_OR_DAVI');
    }
  };

  const handleDropDavi = () => {
    const latestDavi = stateRef.current.daviState;
    if (!latestDavi.offeredBy) return;

    const droppingPlayer = getOpponent(latestDavi.offeredBy);
    const winningPlayer = latestDavi.offeredBy;
    const pointsWon = latestDavi.value; // Receives current value before increase

    sounds.playWinFanfare();
    addLog(
      `🏳️ ${droppingPlayer === 'WHITE' ? 'თეთრმა' : 'შავმა'} დათმო დავი! ${pointsWon} ქულა ${
        winningPlayer === 'WHITE' ? 'თეთრს' : 'შავს'
      }.`
    );

    finishRound(winningPlayer, pointsWon, false, false, true, latestDavi.level, 'DAVI_DROP');
  };

  /**
   * Completes a round when 15 checkers are borne off.
   */
  const handleRoundVictory = (finalBoard: BoardState, winner: Player) => {
    const latestDavi = stateRef.current.daviState;
    const latestSettings = stateRef.current.settings;
    const loser = getOpponent(winner);
    const isMars = finalBoard.borneOff[loser] === 0;
    const isKoksi = isMars && isKoksiLoss(finalBoard, loser);

    // Score calculation
    let multiplier = 1;
    if (isMars) {
      if (latestDavi.level > 0 && !latestSettings.countMarsOnDavi) {
        multiplier = 1; // Courtyard rule: no double mars on davi
      } else {
        multiplier = isKoksi ? 3 : 2; // Koksi = 3x, Mars = 2x
      }
    }

    const pointsWon = latestDavi.value * multiplier;

    sounds.playWinFanfare();
    const winTypeLabel = isKoksi ? 'კოქსით (3x)!' : isMars ? 'მარსით (2x)!' : 'ოინით!';
    addLog(
      `🏆 ${winner === 'WHITE' ? 'თეთრმა' : 'შავმა'} მოიგო ხელი ${winTypeLabel} (+${pointsWon} ქულა)`
    );

    finishRound(
      winner,
      pointsWon,
      isMars,
      isKoksi,
      latestDavi.level > 0,
      latestDavi.level,
      'BEAR_OFF'
    );
  };

  /**
   * Finalizes round scoring, updates match score, and checks match conclusion.
   */
  const finishRound = (
    winner: Player,
    pointsWon: number,
    isMars: boolean,
    isKoksi: boolean,
    isDavi: boolean,
    daviLevel: DaviLevel,
    reason: 'BEAR_OFF' | 'DAVI_DROP'
  ) => {
    const latestScore = stateRef.current.matchScore;
    const latestMode = stateRef.current.gameMode;
    const latestRound = stateRef.current.currentCampaignRound;
    const latestUnlocked = stateRef.current.unlockedCampaignRound;

    const result: RoundResult = {
      winner,
      pointsWon,
      isMars,
      isKoksi,
      isDavi,
      daviLevel,
      reason,
    };
    setLastRoundResult(result);

    const newWhiteScore = latestScore.WHITE + (winner === 'WHITE' ? pointsWon : 0);
    const newBlackScore = latestScore.BLACK + (winner === 'BLACK' ? pointsWon : 0);

    // Update stats
    setStats((prev) => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      gamesWon: winner === 'WHITE' ? prev.gamesWon + 1 : prev.gamesWon,
      marsWon: winner === 'WHITE' && isMars ? prev.marsWon + 1 : prev.marsWon,
      marsLost: winner === 'BLACK' && isMars ? prev.marsLost + 1 : prev.marsLost,
      daviWon: winner === 'WHITE' && isDavi ? prev.daviWon + 1 : prev.daviWon,
      daviAccepted: isDavi ? prev.daviAccepted + 1 : prev.daviAccepted,
    }));

    // Check Crawford rule for the upcoming game
    let nextIsCrawford = false;
    let nextCrawfordPassed = latestScore.crawfordPassed;

    if (!latestScore.crawfordPassed && !latestScore.isCrawford) {
      if (
        newWhiteScore === latestScore.targetScore - 1 ||
        newBlackScore === latestScore.targetScore - 1
      ) {
        nextIsCrawford = true;
      }
    } else if (latestScore.isCrawford) {
      nextIsCrawford = false;
      nextCrawfordPassed = true;
    }

    const updatedScore: MatchScore = {
      ...latestScore,
      WHITE: newWhiteScore,
      BLACK: newBlackScore,
      roundNumber: latestScore.roundNumber + 1,
      isCrawford: nextIsCrawford,
      crawfordPassed: nextCrawfordPassed,
    };
    setMatchScore(updatedScore);

    // Check match victory
    if (newWhiteScore >= latestScore.targetScore || newBlackScore >= latestScore.targetScore) {
      setPhase('MATCH_OVER');
      if (newWhiteScore >= latestScore.targetScore && latestMode === 'CAMPAIGN') {
        const nextRound = latestRound.id + 1;
        if (nextRound > latestUnlocked && nextRound <= 12) {
          setUnlockedCampaignRound(nextRound);
          try {
            localStorage.setItem(STORAGE_KEY_CAMPAIGN, nextRound.toString());
          } catch (e) {
            console.error(e);
          }
        }
      }
    } else {
      setPhase('ROUND_OVER');
    }
  };

  /**
   * AI Autonomous Turn Engine (Runs when phase === 'AI_THINKING')
   */
  useEffect(() => {
    if (phase !== 'AI_THINKING' || turn !== 'BLACK') return;

    const currentBInitial = stateRef.current.board;
    const currentDavi = stateRef.current.daviState;
    const currentMatchScore = stateRef.current.matchScore;
    const diff =
      stateRef.current.gameMode === 'CAMPAIGN'
        ? stateRef.current.currentCampaignRound.difficulty
        : stateRef.current.quickDifficulty;
    const personality =
      stateRef.current.gameMode === 'CAMPAIGN'
        ? stateRef.current.currentCampaignRound.personality
        : undefined;

    let isCancelled = false;

    const runAITurn = async () => {
      await new Promise((r) => setTimeout(r, 550));
      if (isCancelled) return;

      // Step 1: Check if AI offers Davi before rolling
      if (shouldAIOfferDavi(currentBInitial, 'BLACK', currentDavi, currentMatchScore, diff)) {
        handleOfferDavi('BLACK');
        return; // Wait for player response in DAVI_OFFERED phase
      }

      // Step 2: Roll dice with 3D animation
      const d1 = rollFairDie();
      const d2 = rollFairDie();
      const diceArr = d1 === d2 ? [d1, d1, d1, d1] : [d1, d2];
      const georgianName = getGeorgianDiceName(d1, d2);

      setDice([d1, d2]);
      setRollKey((prev) => prev + 1);
      setIsRolling(true);
      sounds.playDiceRoll();

      await new Promise((r) => setTimeout(r, 750));
      if (isCancelled) return;

      setDiceRemaining(diceArr);
      setDiceName(georgianName);
      setIsRolling(false);
      addLog(`შავმა გააგორა: ${d1}-${d2} (${georgianName})`);

      // Record stat
      const high = Math.max(d1, d2);
      const low = Math.min(d1, d2);
      const key = `${high}-${low}`;
      setStats((prev) => ({
        ...prev,
        diceRollsCount: {
          ...prev.diceRollsCount,
          [key]: (prev.diceRollsCount[key] || 0) + 1,
        },
      }));

      const sequences = generateLegalTurnSequences(
        currentBInitial,
        'BLACK',
        diceArr,
        !stateRef.current.settings.allowHitAndCoverInHome
      );

      if (sequences.length === 0) {
        addLog('⚠️ შავს სვლა არ აქვს!');
        await new Promise((r) => setTimeout(r, 1000));
        if (isCancelled) return;
        endTurn(currentBInitial, 'BLACK');
        return;
      }

      // Choose best sequence
      const bestSeq = chooseBestMoveSequence(
        currentBInitial,
        'BLACK',
        sequences,
        diff,
        personality
      );
      if (!bestSeq) {
        endTurn(currentBInitial, 'BLACK');
        return;
      }

      // Execute each sub-move with realistic visual delays
      let currentB = currentBInitial;
      const currentDiceRem = [...diceArr];

      for (let i = 0; i < bestSeq.moves.length; i++) {
        await new Promise((r) => setTimeout(r, 520));
        if (isCancelled) return;

        const m = bestSeq.moves[i];
        currentB = applySingleMove(
          currentB,
          'BLACK',
          m,
          !stateRef.current.settings.allowHitAndCoverInHome
        );

        // Remove die used
        const dIdx = currentDiceRem.indexOf(m.dieUsed);
        if (dIdx !== -1) currentDiceRem.splice(dIdx, 1);

        setBoard(currentB);
        setDiceRemaining([...currentDiceRem]);

        if (m.to === 'OFF') {
          sounds.playBearOff();
        } else if (m.isHit) {
          sounds.playCheckerHit();
        } else {
          sounds.playCheckerMove();
        }

        if (m.isHomeBoardHit) {
          addLog(`🔒 შავმა მოკლა ქვა საკუთარ კარში და ჩაიკეტა!`);
        }

        if (isRoundWon(currentB, 'BLACK')) {
          handleRoundVictory(currentB, 'BLACK');
          return;
        }
      }

      await new Promise((r) => setTimeout(r, 450));
      if (isCancelled) return;
      endTurn(currentB, 'BLACK');
    };

    runAITurn();

    return () => {
      isCancelled = true;
    };
  }, [phase, turn]);

  /**
   * AI response when human offers Davi
   */
  useEffect(() => {
    if (
      phase !== 'DAVI_OFFERED' ||
      daviState.offeredBy !== 'WHITE' ||
      gameMode === 'PASS_AND_PLAY'
    ) {
      return;
    }

    const diff = gameMode === 'CAMPAIGN' ? currentCampaignRound.difficulty : quickDifficulty;

    const timer = setTimeout(() => {
      const accepts = shouldAIAcceptDavi(board, 'BLACK', matchScore, diff);
      if (accepts) {
        handleAcceptDavi();
      } else {
        handleDropDavi();
      }
    }, 900);

    return () => clearTimeout(timer);
  }, [phase, daviState.offeredBy]);

  const movableSourcePoints =
    phase === 'MOVING' && !turnCompletedWaitingConfirm
      ? Array.from(getMovableSourcePoints(board, turn, diceRemaining))
      : [];

  return {
    // State
    board,
    turn,
    phase,
    dice,
    diceRemaining,
    diceName,
    isRolling,
    rollKey,
    daviState,
    matchScore,
    selectedPoint,
    legalTargets,
    movableSourcePoints,
    undoStack,
    hintSequence,
    turnCompletedWaitingConfirm,
    lastRoundResult,
    historyLog,
    gameMode,
    currentCampaignRound,
    unlockedCampaignRound,
    quickDifficulty,
    quickTargetScore,
    settings,
    stats,

    // Actions
    rollDice,
    handleSelectPoint,
    handleDoubleClickPoint,
    executePlayerMove,
    handleUndo,
    handleConfirmTurn,
    handleRequestHint,
    handleOfferDavi,
    handleAcceptDavi,
    handleDropDavi,
    startNewMatch,
    startNewRound,
    updateSettings,
    setGameMode,
    setCurrentCampaignRound,
    setQuickDifficulty,
    setQuickTargetScore,
  };
}
