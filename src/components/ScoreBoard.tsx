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
import { BoardThemeId, BOARD_THEMES } from '../engine/themes';
import {
  ShieldAlert,
  Trophy,
  Volume2,
  VolumeX,
  BarChart3,
  Settings,
  Download,
  Palette,
} from 'lucide-react';

interface ScoreBoardProps {
  gameMode: GameMode;
  campaignRound: CampaignRound;
  matchScore: MatchScore;
  turn: Player;
  phase: GamePhase;
  daviState: DaviState;
  soundEnabled: boolean;
  currentTheme?: BoardThemeId;
  onCycleTheme?: () => void;
  onToggleSound: () => void;
  onOpenCampaign: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenInstall?: () => void;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  gameMode,
  campaignRound,
  matchScore,
  turn,
  phase: _phase,
  daviState,
  soundEnabled,
  currentTheme = 'CLASSIC_WALNUT',
  onCycleTheme,
  onToggleSound,
  onOpenCampaign,
  onOpenStats,
  onOpenSettings,
  onOpenInstall,
}) => {
  const isWhiteTurn = turn === 'WHITE';

  return (
    <header className="w-full h-11 sm:h-12 shrink-0 flex items-center justify-between gap-1.5 sm:gap-3 bg-[#1e0f08]/95 backdrop-blur-md px-2.5 sm:px-4 rounded-xl border border-amber-900/40 shadow-md select-none overflow-hidden">
      {/* Left: Players & Live Score HUD */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        {/* White Player */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all ${
            isWhiteTurn
              ? 'bg-amber-500/25 border border-amber-400/70 shadow-sm ring-1 ring-amber-400'
              : 'opacity-70'
          }`}
        >
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-white to-[#d6c7b2] border border-[#b8a994] flex items-center justify-center text-[10px] sm:text-[11px] font-bold shadow-sm">
            ⚪
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[9px] text-amber-300 font-bold hidden min-[400px]:inline">
              {gameMode === 'PASS_AND_PLAY' ? 'მოთამაშე 1' : 'შენ'}
            </span>
            <span className="text-xs sm:text-base font-black text-white">
              {matchScore.WHITE}
            </span>
          </div>
          {isWhiteTurn && (
            <span className="text-[8px] sm:text-[9px] bg-amber-400 text-black font-extrabold px-1 rounded shadow">
              სვლა
            </span>
          )}
        </div>

        {/* Match Target & Davi Badge */}
        <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-lg bg-[#2b160a] border border-amber-800/40 text-xs shrink-0">
          <div className="text-[10px] sm:text-xs font-bold text-amber-200/90 whitespace-nowrap">
            {matchScore.targetScore}-მდე
          </div>
          <span className="text-amber-500/50">•</span>

          {matchScore.isCrawford ? (
            <div className="flex items-center gap-0.5 text-red-300 text-[9px] sm:text-[10px] font-bold">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              <span>უდავო</span>
            </div>
          ) : (
            <span className="text-[9px] sm:text-[11px] font-bold text-amber-300 whitespace-nowrap">
              {DAVI_LABELS[daviState.level]?.split(' ')[0] || 'უდავო'}
            </span>
          )}
        </div>

        {/* Black Player */}
        <div
          className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg transition-all ${
            !isWhiteTurn
              ? 'bg-amber-500/25 border border-amber-400/70 shadow-sm ring-1 ring-amber-400'
              : 'opacity-70'
          }`}
        >
          {!isWhiteTurn && (
            <span className="text-[8px] sm:text-[9px] bg-amber-400 text-black font-extrabold px-1 rounded shadow">
              სვლა
            </span>
          )}
          <div className="flex flex-col text-right leading-none">
            <span className="text-[9px] text-amber-300 font-bold hidden min-[400px]:inline truncate max-w-[70px]">
              {gameMode === 'CAMPAIGN'
                ? campaignRound.opponentName
                : gameMode === 'QUICK'
                ? 'AI'
                : 'მოთამაშე 2'}
            </span>
            <span className="text-xs sm:text-base font-black text-white">
              {matchScore.BLACK}
            </span>
          </div>
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-[#383333] to-[#0a0909] border border-[#524a4a] flex items-center justify-center text-[10px] sm:text-[11px] font-bold shadow-sm">
            ⚫
          </div>
        </div>
      </div>

      {/* Right: Menu & Setting Triggers (Clean, locked width) */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Campaign map icon */}
        {gameMode === 'CAMPAIGN' && (
          <button
            onClick={onOpenCampaign}
            className="p-1 sm:p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-800/60 border border-amber-700/40 text-amber-200 transition"
            title={`კამპანია (${campaignRound.city})`}
          >
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400" />
          </button>
        )}

        {/* Stats */}
        <button
          onClick={onOpenStats}
          className="p-1 sm:p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-800/60 border border-amber-800/40 text-amber-200 transition"
          title="სტატისტიკა და კამათლის სიხშირე"
        >
          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
        </button>

        {/* Theme quick cycle button */}
        {onCycleTheme && (
          <button
            onClick={onCycleTheme}
            className="p-1 sm:p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-800/60 border border-amber-800/40 text-amber-200 transition flex items-center gap-1"
            title={`დაფის თემა: ${BOARD_THEMES[currentTheme]?.name} (დააჭირე შესაცვლელად)`}
          >
            <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="text-xs hidden min-[520px]:inline">
              {BOARD_THEMES[currentTheme]?.badge}
            </span>
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1 sm:p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-800/60 border border-amber-800/40 text-amber-200 transition"
          title="პარამეტრები"
        >
          <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
        </button>

        {/* Install PWA */}
        {onOpenInstall && (
          <button
            onClick={onOpenInstall}
            className="p-1 sm:p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-800/60 border border-amber-800/40 text-amber-200 transition hidden sm:flex"
            title="აპლიკაციის დაყენება (PWA)"
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>
        )}

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className="p-1 sm:p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-800/60 border border-amber-800/40 text-amber-300 transition"
          title={soundEnabled ? 'ხმის გამორთვა' : 'ხმის ჩართვა'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
          )}
        </button>
      </div>
    </header>
  );
};
