import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { BoardView } from './components/BoardView';
import { DiceDisplay } from './components/DiceDisplay';
import { ScoreBoard } from './components/ScoreBoard';
import { CampaignModal } from './components/CampaignModal';
import { DaviModal } from './components/DaviModal';
import { StatsAndSettingsModal } from './components/StatsAndSettingsModal';
import { RoundOverModal } from './components/RoundOverModal';
import { MessageSquare, ChevronDown, ChevronUp, CheckCircle, RotateCcw } from 'lucide-react';

export const App: React.FC = () => {
  const store = useGameStore();

  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [statsModalTab, setStatsModalTab] = useState<'STATS' | 'SETTINGS' | null>(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Derive hint checker positions if active
  const hintSource =
    store.hintSequence && store.hintSequence.moves.length > 0
      ? store.hintSequence.moves[0].from
      : null;
  const hintTarget =
    store.hintSequence && store.hintSequence.moves.length > 0
      ? store.hintSequence.moves[0].to
      : null;

  const isHumanTurn = store.gameMode === 'PASS_AND_PLAY' || store.turn === 'WHITE';

  const canRoll = store.phase === 'WAITING_FOR_ROLL_OR_DAVI' && isHumanTurn;

  // Handle bear-off click
  const handleBearOffClick = () => {
    if (store.selectedPoint !== null && store.legalTargets.includes(-99)) {
      store.executePlayerMove(store.selectedPoint, 'OFF');
    }
  };

  // Keyboard shortcuts for fast Mac desktop gameplay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCampaignOpen || statsModalTab !== null) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        if (store.turnCompletedWaitingConfirm && isHumanTurn) {
          e.preventDefault();
          store.handleConfirmTurn();
        } else if (canRoll && !store.isRolling) {
          e.preventDefault();
          store.rollDice();
        }
      } else if (
        (e.code === 'Backspace' || e.key.toLowerCase() === 'z') &&
        store.phase === 'MOVING' &&
        isHumanTurn &&
        store.undoStack.length > 0
      ) {
        e.preventDefault();
        store.handleUndo();
      } else if (
        e.key.toLowerCase() === 'h' &&
        store.phase === 'MOVING' &&
        isHumanTurn &&
        !store.turnCompletedWaitingConfirm
      ) {
        e.preventDefault();
        store.handleRequestHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCampaignOpen,
    statsModalTab,
    store.turnCompletedWaitingConfirm,
    store.phase,
    store.isRolling,
    store.undoStack.length,
    isHumanTurn,
    canRoll,
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#140b06] via-[#1c100a] to-[#0d0704] text-[#f7f2ea] flex flex-col justify-start items-center p-2 sm:p-4 select-none">
      {/* Top Header & Match HUD */}
      <div className="w-full max-w-4xl">
        <ScoreBoard
          gameMode={store.gameMode}
          campaignRound={store.currentCampaignRound}
          matchScore={store.matchScore}
          turn={store.turn}
          phase={store.phase}
          daviState={store.daviState}
          canUndo={store.undoStack.length > 0 && isHumanTurn}
          canHint={isHumanTurn && store.phase === 'MOVING' && !store.turnCompletedWaitingConfirm}
          soundEnabled={store.settings.soundEnabled}
          onUndo={store.handleUndo}
          onHint={store.handleRequestHint}
          onOfferDavi={() => store.handleOfferDavi(store.turn)}
          onToggleSound={() =>
            store.updateSettings({ soundEnabled: !store.settings.soundEnabled })
          }
          onOpenCampaign={() => setIsCampaignOpen(true)}
          onOpenStats={() => setStatsModalTab('STATS')}
          onOpenSettings={() => setStatsModalTab('SETTINGS')}
        />
      </div>

      {/* Main Authentic Georgian Nardi Board */}
      <main className="w-full max-w-4xl my-1.5 flex flex-col items-center">
        <BoardView
          board={store.board}
          turn={store.turn}
          selectedPoint={store.selectedPoint}
          legalTargets={store.legalTargets}
          movableSourcePoints={isHumanTurn ? store.movableSourcePoints : []}
          lockedHomeHitPoints={store.board.lockedHomeHitPoints}
          hintSource={hintSource}
          hintTarget={hintTarget}
          showPointNumbers={store.settings.showPointNumbers}
          dice={store.dice}
          diceRemaining={store.diceRemaining}
          isRolling={store.isRolling}
          onPointClick={store.handleSelectPoint}
          onPointDoubleClick={store.handleDoubleClickPoint}
          onBearOffClick={handleBearOffClick}
        />
      </main>

      {/* Interactive Controls Bar: Dice, Confirm & Undo */}
      <div className="w-full max-w-4xl flex flex-col items-center gap-2 my-1">
        {/* If all moves played, show big Confirm Turn button with Undo option */}
        {store.turnCompletedWaitingConfirm && isHumanTurn && (
          <div className="flex items-center gap-3 animate-bounce my-1">
            <button
              onClick={store.handleConfirmTurn}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-sm sm:text-base shadow-xl flex items-center gap-2 border border-emerald-300"
            >
              <CheckCircle className="w-5 h-5" />
              სვლის დასრულება (Space)
            </button>

            {store.undoStack.length > 0 && (
              <button
                onClick={store.handleUndo}
                className="px-4 py-2.5 rounded-2xl bg-amber-900/80 hover:bg-amber-800 text-amber-200 font-bold text-sm shadow flex items-center gap-1.5 border border-amber-600"
              >
                <RotateCcw className="w-4 h-4" />
                დაბრუნება (Undo)
              </button>
            )}
          </div>
        )}

        <DiceDisplay
          dice={store.dice}
          diceRemaining={store.diceRemaining}
          diceName={store.diceName}
          isRolling={store.isRolling}
          canRoll={canRoll}
          onRoll={store.rollDice}
        />

        {/* Live Game Feed & History */}
        <div className="w-full bg-[#1b0d07]/90 backdrop-blur-md border border-amber-900/40 rounded-2xl px-3 sm:px-4 py-1.5 flex flex-col transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {store.historyLog.length > 0
                  ? store.historyLog[0]
                  : 'თამაში მზადაა — გააგორე კამათელი!'}
              </span>
            </div>

            {store.historyLog.length > 1 && (
              <button
                onClick={() => setShowFullHistory(!showFullHistory)}
                className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5"
              >
                {showFullHistory ? (
                  <>
                    <span>დახურვა</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>ისტორია</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Expanded history drawer */}
          {showFullHistory && (
            <div className="mt-2 pt-2 border-t border-amber-900/40 max-h-32 overflow-y-auto space-y-1 text-xs text-amber-200/70">
              {store.historyLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-amber-500/50">•</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CampaignModal
        isOpen={isCampaignOpen}
        unlockedRound={store.unlockedCampaignRound}
        currentRoundId={store.currentCampaignRound.id}
        onClose={() => setIsCampaignOpen(false)}
        onSelectRound={(round) => {
          store.setCurrentCampaignRound(round);
          store.startNewMatch('CAMPAIGN', round.id - 1);
        }}
      />

      <DaviModal
        isOpen={store.phase === 'DAVI_OFFERED'}
        daviState={store.daviState}
        turn={store.turn}
        gameMode={store.gameMode}
        onAccept={store.handleAcceptDavi}
        onDrop={store.handleDropDavi}
      />

      <StatsAndSettingsModal
        isOpen={statsModalTab !== null}
        activeTab={statsModalTab || 'SETTINGS'}
        stats={store.stats}
        settings={store.settings}
        gameMode={store.gameMode}
        quickDifficulty={store.quickDifficulty}
        quickTargetScore={store.quickTargetScore}
        onClose={() => setStatsModalTab(null)}
        onUpdateSettings={store.updateSettings}
        onStartNewMatch={(mode, diff, pts) => {
          store.startNewMatch(mode, 0, diff, pts);
        }}
      />

      <RoundOverModal
        isOpen={store.phase === 'ROUND_OVER' || store.phase === 'MATCH_OVER'}
        result={store.lastRoundResult}
        matchScore={store.matchScore}
        gameMode={store.gameMode}
        campaignRound={store.currentCampaignRound}
        isMatchOver={store.phase === 'MATCH_OVER'}
        onNextRound={() => store.startNewRound()}
        onNewMatch={() => {
          if (store.gameMode === 'CAMPAIGN') {
            store.startNewMatch(
              'CAMPAIGN',
              Math.min(store.unlockedCampaignRound - 1, 11)
            );
          } else {
            store.startNewMatch(
              store.gameMode,
              0,
              store.quickDifficulty,
              store.quickTargetScore
            );
          }
        }}
      />
    </div>
  );
};
