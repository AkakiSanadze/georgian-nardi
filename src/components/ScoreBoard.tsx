import React from 'react';
import {
  CampaignRound,
  DaviState,
  GameMode,
  GamePhase,
  MatchScore,
  Player,
} from '../engine/types';
import { DAVI_LABELS } from '../engine/constants';
import { Lightbulb, RotateCcw, ShieldAlert, Trophy, Volume2, VolumeX, BarChart3, Settings, MapPin } from 'lucide-react';

interface ScoreBoardProps {
  gameMode: GameMode;
  campaignRound: CampaignRound;
  matchScore: MatchScore;
  turn: Player;
  phase: GamePhase;
  daviState: DaviState;
  canUndo: boolean;
  canHint: boolean;
  soundEnabled: boolean;
  onUndo: () => void;
  onHint: () => void;
  onOfferDavi: () => void;
  onToggleSound: () => void;
  onOpenCampaign: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  gameMode,
  campaignRound,
  matchScore,
  turn,
  phase,
  daviState,
  canUndo,
  canHint,
  soundEnabled,
  onUndo,
  onHint,
  onOfferDavi,
  onToggleSound,
  onOpenCampaign,
  onOpenStats,
  onOpenSettings,
}) => {
  const isWhiteTurn = turn === 'WHITE';
  const canOfferDavi =
    phase === 'WAITING_FOR_ROLL_OR_DAVI' &&
    !matchScore.isCrawford &&
    daviState.level < 5 &&
    (daviState.owner === null || daviState.owner === turn) &&
    (gameMode === 'PASS_AND_PLAY' || turn === 'WHITE');

  const nextDaviLevel = daviState.level + 1;
  const nextDaviWord =
    nextDaviLevel === 1
      ? 'დავი! (2)'
      : nextDaviLevel === 2
      ? 'სე! (3)'
      : nextDaviLevel === 3
      ? 'ჩარი! (4)'
      : nextDaviLevel === 4
      ? 'ბეში! (5)'
      : 'შაში! (6)';

  return (
    <header className="w-full max-w-5xl mx-auto flex flex-col gap-2 px-2 py-1.5 sm:py-2">
      {/* Top Bar with Title, Modes & Utility Icons */}
      <div className="flex items-center justify-between gap-2 bg-[#23130b]/80 backdrop-blur-md px-3 sm:px-4 py-2 rounded-2xl border border-amber-900/40 shadow-lg">
        {/* Left: Mode Title or Campaign Location */}
        <div className="flex items-center gap-2">
          {gameMode === 'CAMPAIGN' ? (
            <button
              onClick={onOpenCampaign}
              className="flex items-center gap-1.5 text-left group hover:opacity-90 transition"
            >
              <span className="text-xl sm:text-2xl">{campaignRound.opponentAvatar}</span>
              <div>
                <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                  <MapPin className="w-3 h-3" />
                  <span>
                    რაუნდი {campaignRound.id}/12: {campaignRound.city}
                  </span>
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1 group-hover:text-amber-300">
                  {campaignRound.opponentName}
                  <span className="text-[10px] text-amber-200/60 font-normal hidden sm:inline">
                    ({campaignRound.opponentTitle})
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl">🎲</span>
              <div>
                <div className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  {gameMode === 'QUICK' ? 'თავისუფალი თამაში' : '2 მოთამაშე (ერთ ეკრანზე)'}
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white">
                  ქართული მოკლე ნარდი
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {gameMode === 'CAMPAIGN' && (
            <button
              onClick={onOpenCampaign}
              className="px-2.5 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 text-xs font-bold flex items-center gap-1 transition"
              title="საქართველოს ტურნირის რუკა"
            >
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden md:inline">კამპანია</span>
            </button>
          )}

          <button
            onClick={onOpenStats}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-800/60 border border-amber-800/40 text-amber-200 text-xs font-semibold flex items-center gap-1 transition"
            title="სტატისტიკა და კამათლის სიხშირე"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">სტატისტიკა</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-800/60 border border-amber-800/40 text-amber-200 text-xs font-semibold flex items-center gap-1 transition"
            title="პარამეტრები"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">პარამეტრები</span>
          </button>

          <button
            onClick={onToggleSound}
            className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-800/60 border border-amber-800/40 text-amber-300 transition"
            title={soundEnabled ? 'ხმის გამორთვა' : 'ხმის ჩართვა'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
        </div>
      </div>

      {/* Main Scoreboard & Turn HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center bg-[#1e0f08]/90 backdrop-blur-md px-3 sm:px-4 py-2 rounded-2xl border border-amber-900/30 shadow-md">
        {/* Left Player: White */}
        <div
          className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
            isWhiteTurn
              ? 'bg-amber-500/20 border border-amber-400/60 shadow-inner ring-1 ring-amber-400'
              : 'opacity-75'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white to-[#d6c7b2] border-2 border-[#b8a994] flex items-center justify-center font-bold text-black shadow">
            ⚪
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-200 truncate">
              {gameMode === 'PASS_AND_PLAY' ? 'მოთამაშე 1 (თეთრი)' : 'შენ (თეთრი)'}
            </div>
            <div className="text-lg sm:text-xl font-black text-white">
              {matchScore.WHITE} <span className="text-xs font-normal text-amber-400/70">ქულა</span>
            </div>
          </div>
          {isWhiteTurn && (
            <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded shadow animate-pulse">
              სვლა
            </span>
          )}
        </div>

        {/* Center: Match Target & Davi Cube HUD */}
        <div className="flex flex-col items-center justify-center gap-1 py-1">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300/80">
            <span>მატჩი {matchScore.targetScore}-მდე</span>
            <span>•</span>
            <span>ხელი {matchScore.roundNumber}</span>
          </div>

          {/* Davi Cube / Crawford Indicator */}
          <div className="flex items-center gap-2">
            {matchScore.isCrawford ? (
              <div className="flex items-center gap-1 bg-red-950/80 text-red-300 border border-red-500/60 px-2 py-0.5 rounded text-xs font-bold animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5" /> კროუფორდის რაუნდი (უდავო)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-[#2d180d] px-2.5 py-1 rounded-lg border border-amber-700/50">
                <span className="text-[11px] text-amber-300/70 font-semibold">ფსონი:</span>
                <span className="text-sm font-extrabold text-amber-300">
                  {DAVI_LABELS[daviState.level]}
                </span>
                {daviState.owner && (
                  <span className="text-[10px] text-amber-400/60">
                    ({daviState.owner === 'WHITE' ? 'თეთრის' : 'შავის'})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Davi Action Button (if eligible) */}
          {canOfferDavi && (
            <button
              onClick={onOfferDavi}
              className="mt-1 px-3 py-1 rounded-lg bg-gradient-to-r from-red-700 to-amber-700 hover:from-red-600 hover:to-amber-600 text-white text-xs font-black shadow-md border border-red-400/40 animate-bounce transition"
            >
              📢 {nextDaviWord} თქმა!
            </button>
          )}
        </div>

        {/* Right Player: Black */}
        <div
          className={`flex items-center justify-end gap-3 p-2 rounded-xl transition-all ${
            !isWhiteTurn
              ? 'bg-amber-500/20 border border-amber-400/60 shadow-inner ring-1 ring-amber-400'
              : 'opacity-75'
          }`}
        >
          {!isWhiteTurn && (
            <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded shadow animate-pulse">
              სვლა
            </span>
          )}
          <div className="flex-1 text-right min-w-0">
            <div className="text-xs font-bold text-amber-200 truncate">
              {gameMode === 'CAMPAIGN'
                ? campaignRound.opponentName
                : gameMode === 'QUICK'
                ? 'AI მოწინააღმდეგე'
                : 'მოთამაშე 2 (შავი)'}
            </div>
            <div className="text-lg sm:text-xl font-black text-white">
              {matchScore.BLACK} <span className="text-xs font-normal text-amber-400/70">ქულა</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#383333] to-[#0a0909] border-2 border-[#524a4a] flex items-center justify-center font-bold text-white shadow">
            ⚫
          </div>
        </div>
      </div>

      {/* In-Turn Helper Bar (Undo & Hint buttons) */}
      {phase === 'MOVING' && (isWhiteTurn || gameMode === 'PASS_AND_PLAY') && (
        <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 rounded-xl border border-amber-900/30 text-xs">
          <div className="text-amber-300/80 font-medium flex items-center gap-1.5">
            <span>💡 დააჭირე ქვას (ან ორჯერ დააწკაპუნე სწრაფი სვლისთვის) • Space: დადასტურება</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 font-bold transition ${
                canUndo
                  ? 'bg-amber-950/80 hover:bg-amber-800 border-amber-600 text-amber-200 shadow'
                  : 'bg-black/20 border-white/10 text-white/30 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>დაბრუნება (Undo)</span>
            </button>

            <button
              onClick={onHint}
              disabled={!canHint}
              className="px-2.5 py-1 rounded-lg bg-yellow-950/80 hover:bg-yellow-800 border border-yellow-500 text-yellow-300 flex items-center gap-1 font-bold shadow transition"
              title="დიდოსტატი AI-ს კარნახი"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>კარნახი</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
