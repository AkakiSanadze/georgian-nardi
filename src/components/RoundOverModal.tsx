import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CampaignRound, GameMode, MatchScore, RoundResult } from '../engine/types';
import { Trophy, ArrowRight, RotateCw, Award, Sparkles } from 'lucide-react';

interface RoundOverModalProps {
  isOpen: boolean;
  result: RoundResult | null;
  matchScore: MatchScore;
  gameMode: GameMode;
  campaignRound: CampaignRound;
  isMatchOver: boolean;
  onNextRound: () => void;
  onNewMatch: () => void;
}

export const RoundOverModal: React.FC<RoundOverModalProps> = ({
  isOpen,
  result,
  matchScore,
  gameMode,
  campaignRound,
  isMatchOver,
  onNextRound,
  onNewMatch,
}) => {
  useEffect(() => {
    if (isOpen && result) {
      if (result.winner === 'WHITE' || isMatchOver) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#f7f2ea', '#10b981', '#f59e0b'],
        });
      }
    }
  }, [isOpen, result, isMatchOver]);

  if (!isOpen || !result) return null;

  const isWhiteWinner = result.winner === 'WHITE';
  const winnerName =
    gameMode === 'PASS_AND_PLAY'
      ? isWhiteWinner
        ? 'თეთრი მოთამაშე'
        : 'შავი მოთამაშე'
      : isWhiteWinner
      ? 'შენ გაიმარჯვე!'
      : campaignRound.opponentName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in safe-pb safe-pt">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#33170b] via-[#241006] to-[#120703] border-2 sm:border-4 border-amber-500 rounded-3xl shadow-2xl p-4 sm:p-6 text-center text-amber-100 flex flex-col items-center">
        {/* Trophy / Laurel Icon */}
        <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3 shadow-lg">
          {isMatchOver ? (
            <Trophy className="w-9 h-9 text-yellow-400 animate-bounce" />
          ) : (
            <Award className="w-9 h-9 text-amber-300" />
          )}
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-700/50 mb-2">
          {isMatchOver ? 'მატჩი დასრულდა!' : 'ხელი დასრულდა!'}
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
          {winnerName}
        </h2>

        {/* Victory Details: Koksi / Mars / Davi / Points */}
        <div className="flex items-center gap-2 my-3">
          {result.isKoksi ? (
            <span className="px-3 py-1 rounded-xl bg-purple-600/30 border border-purple-400 text-purple-200 text-xs font-black animate-pulse flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> კოქსი! (3x)
            </span>
          ) : (
            result.isMars && (
              <span className="px-3 py-1 rounded-xl bg-red-600/30 border border-red-500 text-red-300 text-xs font-black animate-pulse flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> მარსი! (2x)
              </span>
            )
          )}
          {result.isDavi && (
            <span className="px-3 py-1 rounded-xl bg-amber-600/30 border border-amber-500 text-amber-300 text-xs font-black">
              დავი (დონე {result.daviLevel})
            </span>
          )}
          <span className="px-3 py-1 rounded-xl bg-emerald-600/30 border border-emerald-500 text-emerald-300 text-xs font-black">
            +{result.pointsWon} ქულა
          </span>
        </div>

        {/* Current Match Score Board */}
        <div className="w-full bg-black/40 rounded-2xl border border-amber-900/40 p-4 my-3 flex items-center justify-around">
          <div className="text-center">
            <div className="text-xs text-amber-300/70 font-bold">თეთრი</div>
            <div className="text-2xl font-black text-white">{matchScore.WHITE}</div>
          </div>
          <div className="text-xs font-black text-amber-400/60 uppercase">
            / {matchScore.targetScore} ქულამდე /
          </div>
          <div className="text-center">
            <div className="text-xs text-amber-300/70 font-bold">შავი</div>
            <div className="text-2xl font-black text-white">{matchScore.BLACK}</div>
          </div>
        </div>

        {/* Next Action Button */}
        {isMatchOver ? (
          <button
            onClick={onNewMatch}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition"
          >
            <RotateCw className="w-5 h-5" /> ახალი მატჩის დაწყება
          </button>
        ) : (
          <button
            onClick={onNextRound}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition"
          >
            <span>შემდეგი ხელი</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
