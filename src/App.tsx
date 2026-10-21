import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { BoardView } from './components/BoardView';
import { DiceDisplay } from './components/DiceDisplay';
import { ScoreBoard } from './components/ScoreBoard';
import { CampaignModal } from './components/CampaignModal';
import { DaviModal } from './components/DaviModal';
import { StatsAndSettingsModal } from './components/StatsAndSettingsModal';
import { RoundOverModal } from './components/RoundOverModal';
import { InstallModal } from './components/InstallModal';
import { MessageSquare, X } from 'lucide-react';

export const App: React.FC = () => {
  const store = useGameStore();

  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [statsModalTab, setStatsModalTab] = useState<'STATS' | 'SETTINGS' | null>(null);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
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

  // Compute Davi offer eligibility
  const canOfferDavi =
    store.phase === 'WAITING_FOR_ROLL_OR_DAVI' &&
    !store.matchScore.isCrawford &&
    store.daviState.level < 5 &&
    (store.daviState.owner === null || store.daviState.owner === store.turn) &&
    (store.gameMode === 'PASS_AND_PLAY' || store.turn === 'WHITE');

  const nextDaviLevel = store.daviState.level + 1;
  const nextDaviWord =
    nextDaviLevel === 1
      ? 'დავი (2)'
      : nextDaviLevel === 2
      ? 'სე (3)'
      : nextDaviLevel === 3
      ? 'ჩარი (4)'
      : nextDaviLevel === 4
      ? 'ბეში (5)'
      : 'შაში (6)';

  // Handle bear-off click
  const handleBearOffClick = () => {
    if (store.selectedPoint !== null && store.legalTargets.includes(-99)) {
      store.executePlayerMove(store.selectedPoint, 'OFF');
    }
  };

  // Prevent unwanted scrolling on iOS Safari while allowing touch controls
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      // Only block touchmove on the game board and outer app shell (not inside modals or scrollable history)
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.allow-scroll')) {
        return;
      }
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => document.removeEventListener('touchmove', handleTouchMove);
  }, []);

  // Keyboard shortcuts for fast desktop gameplay (kept safe without affecting mobile)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable;

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        if (!isInput) {
          e.preventDefault();
        }
      }

      if (isCampaignOpen || statsModalTab !== null || isInstallOpen) return;

      if (e.code === 'Space' || e.code === 'Enter' || e.key === ' ' || e.key === 'Enter') {
        if (e.repeat) return;

        if (store.turnCompletedWaitingConfirm && isHumanTurn) {
          if (!isInput) e.preventDefault();
          store.handleConfirmTurn();
        } else if (canRoll && !store.isRolling) {
          if (!isInput) e.preventDefault();
          store.rollDice();
        }
      } else if (
        (e.code === 'Backspace' || e.key.toLowerCase() === 'z') &&
        store.phase === 'MOVING' &&
        isHumanTurn &&
        store.undoStack.length > 0
      ) {
        if (!isInput) {
          e.preventDefault();
          store.handleUndo();
        }
      } else if (
        e.key.toLowerCase() === 'h' &&
        store.phase === 'MOVING' &&
        isHumanTurn &&
        !store.turnCompletedWaitingConfirm
      ) {
        if (!isInput) {
          e.preventDefault();
          store.handleRequestHint();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isCampaignOpen,
    statsModalTab,
    isInstallOpen,
    store.turnCompletedWaitingConfirm,
    store.phase,
    store.isRolling,
    store.undoStack.length,
    isHumanTurn,
    canRoll,
  ]);

  return (
    <div className="fixed inset-0 w-full w-screen h-full h-[100dvh] bg-gradient-to-b from-[#140b06] via-[#1c100a] to-[#0d0704] text-[#f7f2ea] flex flex-col justify-between items-center safe-pt safe-pb safe-pl safe-pr p-1 sm:p-2 select-none overflow-hidden touch-none font-['Noto_Sans_Georgian',system-ui,sans-serif]">
      {/* Top Header & Match HUD (Locked Height) */}
      <div className="w-full max-w-5xl shrink-0">
        <ScoreBoard
          gameMode={store.gameMode}
          campaignRound={store.currentCampaignRound}
          matchScore={store.matchScore}
          turn={store.turn}
          phase={store.phase}
          daviState={store.daviState}
          soundEnabled={store.settings.soundEnabled}
          onToggleSound={() =>
            store.updateSettings({ soundEnabled: !store.settings.soundEnabled })
          }
          onOpenCampaign={() => setIsCampaignOpen(true)}
          onOpenStats={() => setStatsModalTab('STATS')}
          onOpenSettings={() => setStatsModalTab('SETTINGS')}
          onOpenInstall={() => setIsInstallOpen(true)}
        />
      </div>

      {/* Main Authentic Georgian Nardi Board (Flex-1, Zero Layout Shift) */}
      <main className="w-full max-w-5xl flex-1 min-h-0 flex flex-col items-center justify-center relative overflow-hidden py-0.5 sm:py-1">
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
          rollKey={store.rollKey}
          canRoll={canRoll}
          onRoll={store.rollDice}
          onPointClick={store.handleSelectPoint}
          onPointDoubleClick={store.handleDoubleClickPoint}
          onBearOffClick={handleBearOffClick}
        />
      </main>

      {/* Bottom Game Controls Dock & Status Ticker (Locked Height, Thumb-Zone Friendly) */}
      <footer className="w-full max-w-5xl shrink-0 flex flex-col gap-1 relative z-30">
        {/* Subtle 1-Line Status Ticker (Strict truncate, never causes wrapping) */}
        <div className="w-full h-5 sm:h-6 flex items-center justify-between px-2 text-[10px] sm:text-xs text-amber-300 font-bold overflow-hidden">
          <div className="flex items-center gap-1.5 truncate">
            <MessageSquare className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="truncate">
              {store.historyLog.length > 0
                ? store.historyLog[0]
                : 'თამაში მზადაა — გააგორე კამათელი!'}
            </span>
          </div>

          {store.historyLog.length > 1 && (
            <button
              onClick={() => setShowFullHistory(!showFullHistory)}
              className="text-[10px] sm:text-[11px] text-amber-400/80 hover:text-amber-300 ml-2 shrink-0 underline"
            >
              {showFullHistory ? 'დახურვა' : 'ისტორია'}
            </button>
          )}
        </div>

        {/* Thumb-Zone Bottom Dock */}
        <DiceDisplay
          dice={store.dice}
          diceRemaining={store.diceRemaining}
          diceName={store.diceName}
          isRolling={store.isRolling}
          canRoll={canRoll}
          onRoll={store.rollDice}
          turnCompletedWaitingConfirm={store.turnCompletedWaitingConfirm && isHumanTurn}
          canUndo={store.undoStack.length > 0 && isHumanTurn}
          canHint={isHumanTurn && store.phase === 'MOVING' && !store.turnCompletedWaitingConfirm}
          canOfferDavi={canOfferDavi}
          nextDaviWord={nextDaviWord}
          onConfirmTurn={store.handleConfirmTurn}
          onUndo={store.handleUndo}
          onHint={store.handleRequestHint}
          onOfferDavi={() => store.handleOfferDavi(store.turn)}
          historyCount={store.historyLog.length}
          isHistoryOpen={showFullHistory}
          onToggleHistory={() => setShowFullHistory(!showFullHistory)}
        />

        {/* Floating Overlay History Drawer (Zero Layout Impact on Board) */}
        {showFullHistory && (
          <div className="absolute bottom-full mb-1 inset-x-0 bg-[#1c0e07]/95 backdrop-blur-xl border border-amber-900/60 rounded-2xl p-3 shadow-2xl max-h-48 overflow-y-auto allow-scroll animate-fade-in z-50 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-amber-900/40 text-amber-300 font-bold">
              <span>სვლების სრული ისტორია</span>
              <button
                onClick={() => setShowFullHistory(false)}
                className="p-1 rounded-full bg-amber-950 hover:bg-amber-900 text-amber-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="mt-2 space-y-1 max-h-36 overflow-y-auto allow-scroll text-amber-200/80 font-mono text-[11px]">
              {store.historyLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="text-amber-500">•</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </footer>

      {/* Modals with Native iOS Sheet Polish */}
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
        onOpenInstall={() => setIsInstallOpen(true)}
      />

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
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
