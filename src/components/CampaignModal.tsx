import React from 'react';
import { CampaignRound } from '../engine/types';
import { CAMPAIGN_ROUNDS } from '../engine/constants';
import { Lock, MapPin, Trophy, X, CheckCircle2 } from 'lucide-react';

interface CampaignModalProps {
  isOpen: boolean;
  unlockedRound: number;
  currentRoundId: number;
  onClose: () => void;
  onSelectRound: (round: CampaignRound) => void;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  unlockedRound,
  currentRoundId,
  onClose,
  onSelectRound,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gradient-to-b from-[#2d180d] to-[#170a04] border-2 sm:border-4 border-amber-600/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-amber-100">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-amber-900/40 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                საქართველოს ნარდის პირველობა
              </h2>
              <p className="text-xs sm:text-sm text-amber-300/70">
                12-რაუნდიანი კამპანია — გაიარე გზა თბილისის ეზოდან ოქროს კამათლის ფინალამდე!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-800/40 text-amber-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Campaign Map / Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {CAMPAIGN_ROUNDS.map((round) => {
            const isUnlocked = round.id <= unlockedRound;
            const isCurrent = round.id === currentRoundId;
            const isCompleted = round.id < unlockedRound;

            return (
              <div
                key={round.id}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectRound(round);
                    onClose();
                  }
                }}
                className={`relative rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                  !isUnlocked
                    ? 'bg-black/40 border-amber-950/40 opacity-50 cursor-not-allowed'
                    : isCurrent
                    ? 'bg-gradient-to-br from-amber-900/50 via-[#3a1d0f] to-[#241107] border-amber-400 ring-2 ring-amber-400 shadow-xl cursor-pointer hover:scale-[1.02]'
                    : 'bg-[#221008] border-amber-900/50 hover:border-amber-500/60 shadow-lg cursor-pointer hover:scale-[1.01]'
                }`}
              >
                {/* Top Badge: City & Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-black/40 border border-amber-800/40 text-amber-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> რაუნდი {round.id}: {round.city}
                  </span>

                  {isCompleted ? (
                    <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" /> მოგებული
                    </span>
                  ) : !isUnlocked ? (
                    <span className="text-amber-500/60 flex items-center gap-1 text-xs font-bold">
                      <Lock className="w-3.5 h-3.5" /> ჩაკეტილი
                    </span>
                  ) : (
                    <span className="text-amber-300 text-xs font-extrabold bg-amber-500/20 px-2 py-0.5 rounded">
                      ღიაა!
                    </span>
                  )}
                </div>

                {/* Opponent Info */}
                <div className="flex items-center gap-3 my-2">
                  <div className="w-12 h-12 rounded-2xl bg-black/50 border border-amber-700/40 flex items-center justify-center text-2xl shadow-inner">
                    {round.opponentAvatar}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white leading-tight">
                      {round.opponentName}
                    </h3>
                    <div className="text-xs text-amber-400/80 font-medium">
                      {round.opponentTitle}
                    </div>
                    <div className="text-[11px] text-amber-300/60">
                      სირთულე: <span className="font-bold text-amber-200">{round.difficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Location & Quote */}
                <div className="mt-2 text-xs italic text-amber-200/70 border-t border-amber-900/30 pt-2 line-clamp-2">
                  {round.description}
                </div>

                {/* Target Score Footer */}
                <div className="mt-3 pt-2 border-t border-amber-900/40 flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-400/80">{round.location}</span>
                  <span className="bg-amber-950/80 border border-amber-700/60 px-2 py-0.5 rounded text-amber-300">
                    {round.targetScore} ქულამდე
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
