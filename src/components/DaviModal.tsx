import React from 'react';
import { DaviState, GameMode, Player } from '../engine/types';
import { Check, Flag, Flame } from 'lucide-react';

interface DaviModalProps {
  isOpen: boolean;
  daviState: DaviState;
  turn: Player;
  gameMode: GameMode;
  onAccept: () => void;
  onDrop: () => void;
}

export const DaviModal: React.FC<DaviModalProps> = ({
  isOpen,
  daviState,
  gameMode,
  onAccept,
  onDrop,
}) => {
  if (!isOpen || !daviState.offeredBy) return null;

  // In campaign/quick, only show modal if AI offered Davi to Human (offeredBy === 'BLACK')
  // In pass-and-play, show to whichever player is receiving the offer
  const isHumanResponding =
    gameMode === 'PASS_AND_PLAY' || daviState.offeredBy === 'BLACK';

  if (!isHumanResponding) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-none">
        <div className="bg-[#2d180d] border-2 border-amber-500 p-6 rounded-3xl shadow-2xl text-center max-w-sm">
          <Flame className="w-10 h-10 text-amber-400 mx-auto animate-bounce mb-2" />
          <h3 className="text-xl font-black text-white">დავი შეთავაზებულია!</h3>
          <p className="text-sm text-amber-200/80 mt-1">მოწინააღმდეგე ფიქრობს პასუხზე...</p>
        </div>
      </div>
    );
  }

  const offeringPlayerName =
    daviState.offeredBy === 'WHITE' ? 'თეთრმა' : 'შავმა (მოწინააღმდეგემ)';

  const daviWord =
    daviState.offeredValue === 2
      ? 'დავი'
      : daviState.offeredValue === 3
      ? 'სე'
      : daviState.offeredValue === 4
      ? 'ჩარი'
      : daviState.offeredValue === 5
      ? 'ბეში'
      : 'შაში';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#33170b] via-[#241006] to-[#120703] border-4 border-amber-500 rounded-3xl shadow-2xl p-6 text-center text-amber-100 flex flex-col items-center">
        {/* Flame Badge */}
        <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center mb-4 shadow-lg">
          <Flame className="w-8 h-8 text-red-500 animate-pulse" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-700/50 mb-2">
          ქართული დავის სისტემა
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
          📢 {offeringPlayerName} თქვა „{daviWord}!“
        </h2>

        <p className="text-sm text-amber-200/80 mb-6">
          თუ მიიღებ, მიმდინარე ხელის ფსონი გახდება{' '}
          <strong className="text-amber-300 font-extrabold text-base">
            {daviState.offeredValue} ქულა
          </strong>
          . თუ დათმობ, მოწინააღმდეგე მაშინვე მიიღებს{' '}
          <strong className="text-red-400 font-bold">{daviState.value} ქულას</strong>.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <button
            onClick={onAccept}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/30 border border-emerald-400/40 flex items-center justify-center gap-2 transform active:scale-95 transition"
          >
            <Check className="w-5 h-5" strokeWidth={3} />
            ვიღებ! ({daviState.offeredValue} ქულა)
          </button>

          <button
            onClick={onDrop}
            className="py-3 px-4 rounded-2xl bg-gradient-to-r from-red-800 to-red-700 hover:from-red-700 hover:to-red-600 text-white font-black text-sm sm:text-base shadow-lg shadow-red-800/30 border border-red-500/40 flex items-center justify-center gap-2 transform active:scale-95 transition"
          >
            <Flag className="w-5 h-5" />
            ვთმობ (-{daviState.value} ქულა)
          </button>
        </div>
      </div>
    </div>
  );
};
