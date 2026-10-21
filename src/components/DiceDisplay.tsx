import React from 'react';
import { Dices } from 'lucide-react';

interface DiceDisplayProps {
  dice: [number, number] | null;
  diceRemaining: number[];
  diceName: string;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
}

export const DiceDisplay: React.FC<DiceDisplayProps> = ({
  dice,
  diceRemaining,
  diceName,
  isRolling,
  canRoll,
  onRoll,
}) => {
  // Renders the 9-dot grid for standard 6-sided die
  const renderPipGrid = (val: number) => {
    // Standard pip positions on a 3x3 grid:
    // [0, 1, 2]
    // [3, 4, 5]
    // [6, 7, 8]
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
      <div className="grid grid-cols-3 grid-rows-3 w-8 h-8 sm:w-10 sm:h-10 p-1">
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
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3">
        {/* Roll Button */}
        {canRoll && (
          <button
            onClick={onRoll}
            disabled={isRolling}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold shadow-lg hover:shadow-amber-500/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2 border border-amber-300/40 text-sm sm:text-base animate-pulse"
          >
            <Dices className="w-5 h-5" />
            გაგორება!
          </button>
        )}

        {/* Dice Visuals */}
        {dice && (
          <div className="flex items-center gap-2 sm:gap-3 bg-black/40 px-3 py-2 rounded-2xl border border-amber-900/40 backdrop-blur-sm">
            {/* If double, show up to 4 dice tiles indicating remaining moves */}
            {isDouble ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const isAvailable = idx < diceRemaining.length;
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#f7f2ea] to-[#ded4c3] border-2 border-[#b8a994] shadow-md transition-all ${
                        isAvailable
                          ? 'opacity-100 scale-100'
                          : 'opacity-30 scale-90 border-dashed'
                      } ${isRolling ? 'animate-spin' : ''}`}
                    >
                      {renderPipGrid(dice[0])}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Non-double: 2 dice
              <div className="flex items-center gap-2 sm:gap-3">
                {dice.map((val, idx) => {
                  const isAvailable = diceRemaining.includes(val);
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-11 sm:w-13 sm:h-13 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#ffffff] via-[#f7f2ea] to-[#ded4c3] border-2 border-[#b8a994] shadow-md transition-all ${
                        isAvailable
                          ? 'opacity-100 scale-100'
                          : 'opacity-30 scale-90 border-dashed'
                      } ${isRolling ? 'animate-spin' : ''}`}
                    >
                      {renderPipGrid(val)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Georgian Dice Name Banner */}
      {diceName && !isRolling && (
        <div className="px-3 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-bold tracking-wide shadow-md flex items-center gap-1.5 animate-fade-in">
          <span>🎲</span>
          <span className="font-extrabold text-amber-300">{diceName}</span>
          <span className="text-[11px] text-amber-400/80 font-mono">
            ({dice ? (dice[0] === dice[1] ? `${dice[0]}-${dice[1]} (4 სვლა)` : `${dice[0]}-${dice[1]}`) : ''})
          </span>
        </div>
      )}
    </div>
  );
};
