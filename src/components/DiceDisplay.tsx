import React from 'react';
import { Dices, CheckCircle, RotateCcw, Lightbulb, MessageSquare, ChevronUp, ChevronDown } from 'lucide-react';

interface DiceDisplayProps {
  dice: [number, number] | null;
  diceRemaining: number[];
  diceName: string;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  turnCompletedWaitingConfirm?: boolean;
  canUndo?: boolean;
  canHint?: boolean;
  canOfferDavi?: boolean;
  nextDaviWord?: string;
  onConfirmTurn?: () => void;
  onUndo?: () => void;
  onHint?: () => void;
  onOfferDavi?: () => void;
  historyCount?: number;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
}

export const DiceDisplay: React.FC<DiceDisplayProps> = ({
  dice,
  diceRemaining,
  diceName,
  isRolling,
  canRoll,
  onRoll,
  turnCompletedWaitingConfirm = false,
  canUndo = false,
  canHint = false,
  canOfferDavi = false,
  nextDaviWord = 'დავი! (2)',
  onConfirmTurn,
  onUndo,
  onHint,
  onOfferDavi,
  historyCount = 0,
  isHistoryOpen = false,
  onToggleHistory,
}) => {
  // Renders the 9-dot grid for standard 6-sided die
  const renderPipGrid = (val: number) => {
    const pips: Record<number, number[]> = {
      1: [4],
      2: [2, 6],
      3: [2, 4, 6],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activePips = pips[val] || [];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-7 h-7 sm:w-8 sm:h-8 p-0.5 sm:p-1">
        {Array.from({ length: 9 }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-center">
            {activePips.includes(idx) && (
              <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-inner ${
                  val === 1 ? 'bg-red-600' : 'bg-[#1a1818]'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const isDouble = dice && dice[0] === dice[1];

  return (
    <div className="w-full h-12 sm:h-14 shrink-0 flex items-center justify-between px-2 sm:px-3 bg-[#180c07]/95 backdrop-blur-md rounded-2xl border border-amber-900/40 shadow-lg select-none">
      {/* Left Slot: Undo & Hint or Davi */}
      <div className="flex items-center gap-1 min-w-[70px] sm:min-w-[120px]">
        {canUndo && (
          <button
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onUndo?.();
            }}
            className="px-2 py-1.5 rounded-xl bg-amber-900/70 hover:bg-amber-800 text-amber-200 font-bold text-[11px] sm:text-xs shadow flex items-center gap-1 border border-amber-600/70 active:scale-95 transition"
            title="სვლის დაბრუნება (Undo)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden min-[420px]:inline">უკან</span>
          </button>
        )}

        {canHint && (
          <button
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onHint?.();
            }}
            className="px-2 py-1.5 rounded-xl bg-yellow-950/70 hover:bg-yellow-900 text-yellow-300 font-bold text-[11px] sm:text-xs shadow flex items-center gap-1 border border-yellow-500/70 active:scale-95 transition"
            title="კარნახი (Hint)"
          >
            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
            <span className="hidden min-[420px]:inline">კარნახი</span>
          </button>
        )}

        {canOfferDavi && !canUndo && (
          <button
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onOfferDavi?.();
            }}
            className="px-2 py-1.5 rounded-xl bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 text-white font-black text-[11px] sm:text-xs shadow flex items-center gap-1 border border-red-400/60 active:scale-95 transition animate-pulse"
            title="დავის თქმა"
          >
            <span>📢</span>
            <span className="whitespace-nowrap">{nextDaviWord}</span>
          </button>
        )}
      </div>

      {/* Center Slot: Main Action (Confirm, Roll, or Dice Tiles) */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {turnCompletedWaitingConfirm ? (
          <button
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onConfirmTurn?.();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-xs sm:text-sm shadow-[0_0_15px_rgba(16,185,129,0.5)] flex items-center gap-1.5 border border-emerald-300 active:scale-95 transition"
          >
            <CheckCircle className="w-4 h-4" />
            <span>სვლის დასრულება</span>
          </button>
        ) : canRoll && !isRolling ? (
          <button
            onClick={(e) => {
              (e.currentTarget as HTMLElement).blur();
              onRoll();
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 text-white font-black shadow-[0_0_18px_rgba(217,119,6,0.6)] active:scale-95 transition flex items-center gap-1.5 border border-amber-300/60 text-xs sm:text-sm animate-pulse"
          >
            <Dices className="w-4 h-4" />
            <span>გააგორე!</span>
          </button>
        ) : dice || isRolling ? (
          <div className="flex items-center gap-1.5">
            {/* Pip tiles */}
            <div className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-xl border border-amber-900/40 backdrop-blur-sm">
              {isDouble ? (
                <div className="flex items-center gap-1">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const isAvailable = idx < diceRemaining.length;
                    return (
                      <div
                        key={idx}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#f7f2ea] to-[#ded4c3] border border-[#b8a994] shadow-sm transition-all ${
                          isAvailable
                            ? 'opacity-100 scale-100'
                            : 'opacity-25 scale-90 border-dashed'
                        }`}
                      >
                        {renderPipGrid(dice[0])}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {dice?.map((val, idx) => {
                    const isAvailable = diceRemaining.includes(val);
                    return (
                      <div
                        key={idx}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#f7f2ea] to-[#ded4c3] border border-[#b8a994] shadow-sm transition-all ${
                          isAvailable
                            ? 'opacity-100 scale-100'
                            : 'opacity-25 scale-90 border-dashed'
                        }`}
                      >
                        {renderPipGrid(val)}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Georgian name badge */}
            {diceName && !isRolling && (
              <div className="px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-200 text-[10px] sm:text-xs font-bold shadow-sm whitespace-nowrap hidden min-[360px]:flex items-center gap-1">
                <span className="font-extrabold text-amber-300">{diceName}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Right Slot: History Toggle */}
      <div className="flex items-center justify-end min-w-[70px] sm:min-w-[120px]">
        {onToggleHistory && (
          <button
            onClick={onToggleHistory}
            className="px-2 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/60 border border-amber-800/40 text-amber-300 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition"
            title="სვლების ისტორია"
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden min-[420px]:inline">
              ისტორია{historyCount > 0 ? ` (${historyCount})` : ''}
            </span>
            {isHistoryOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
