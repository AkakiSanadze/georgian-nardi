import React, { useState } from 'react';
import { AIDifficulty, GameMode, GameSettings, GameStats } from '../engine/types';
import { BOARD_THEMES, THEME_ORDER } from '../engine/themes';
import { haptics } from '../audio/haptics';
import { sounds } from '../audio/soundEngine';
import { BarChart3, Settings, Volume2, VolumeX, X, PlayCircle, Dices, Award, Smartphone, Palette, Check, Zap, RotateCcw, ChevronDown } from 'lucide-react';

interface StatsAndSettingsModalProps {
  isOpen: boolean;
  activeTab: 'NEW_GAME' | 'STATS' | 'SETTINGS';
  stats: GameStats;
  settings: GameSettings;
  gameMode: GameMode;
  quickDifficulty: AIDifficulty;
  quickTargetScore: number;
  isMatchInProgress?: boolean;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartNewMatch: (mode: GameMode, difficulty: AIDifficulty, targetScore: number) => void;
  onResetCurrentMatch?: () => void;
  onOpenInstall?: () => void;
}

export const StatsAndSettingsModal: React.FC<StatsAndSettingsModalProps> = ({
  isOpen,
  activeTab: initialTab,
  stats,
  settings,
  gameMode,
  quickDifficulty,
  quickTargetScore,
  isMatchInProgress = false,
  onClose,
  onUpdateSettings,
  onStartNewMatch,
  onResetCurrentMatch,
  onOpenInstall,
}) => {
  const [tab, setTab] = useState<'NEW_GAME' | 'STATS' | 'SETTINGS'>(initialTab);

  React.useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [selectedMode, setSelectedMode] = useState<GameMode>(gameMode);
  const [selectedDiff, setSelectedDiff] = useState<AIDifficulty>(quickDifficulty);
  const [selectedTarget, setSelectedTarget] = useState<number>(quickTargetScore);

  if (!isOpen) return null;

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  // Dice roll frequency computation
  const totalRolls = Object.values(stats.diceRollsCount).reduce((a, b) => a + b, 0);

  const renderNewMatchSection = () => (
    <div className="bg-black/30 p-4 sm:p-5 rounded-2xl border border-amber-900/40 space-y-4">
      <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
        <PlayCircle className="w-4 h-4 text-amber-400" /> ახალი თამაშის წამოწყება
      </h3>

      <div className="space-y-2">
        <label className="text-xs text-amber-300/80 font-bold">თამაშის რეჟიმი:</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'CAMPAIGN', label: 'კამპანია' },
            { id: 'QUICK', label: 'AI-სთან' },
            { id: 'PASS_AND_PLAY', label: '2 მოთამაშე' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMode(m.id as GameMode)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition ${
                selectedMode === m.id
                  ? 'bg-amber-500 text-black font-black shadow'
                  : 'bg-black/40 border border-amber-900/40 text-amber-200'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {selectedMode === 'QUICK' && (
        <div className="space-y-2">
          <label className="text-xs text-amber-300/80 font-bold">AI სირთულე:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'BEGINNER', label: 'დამწყები' },
              { id: 'AMATEUR', label: 'მოყვარული' },
              { id: 'SKILLED', label: 'გამოცდილი' },
              { id: 'GRANDMASTER', label: 'დიდოსტატი' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDiff(d.id as AIDifficulty)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                  selectedDiff === d.id
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-black/40 border border-amber-900/40 text-amber-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedMode !== 'CAMPAIGN' && (
        <div className="space-y-2">
          <label className="text-xs text-amber-300/80 font-bold">მატჩის ქულები:</label>
          <div className="flex items-center gap-2">
            {[1, 3, 5, 7, 11].map((pts) => (
              <button
                key={pts}
                onClick={() => setSelectedTarget(pts)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  selectedTarget === pts
                    ? 'bg-amber-500 text-black font-black'
                    : 'bg-black/40 border border-amber-900/40 text-amber-200'
                }`}
              >
                {pts}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (isMatchInProgress) {
            const confirmed = window.confirm(
              'მიმდინარე მატჩი არ დასრულებულა. ნამდვილად გსურს ახალი მატჩის დაწყება? არსებული პროგრესი განულდება.'
            );
            if (!confirmed) return;
          }
          onStartNewMatch(selectedMode, selectedDiff, selectedTarget);
          onClose();
        }}
        className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition"
      >
        <PlayCircle className="w-5 h-5" /> ახალი მატჩის დაწყება
      </button>

      {onResetCurrentMatch && isMatchInProgress && (
        <button
          onClick={() => {
            const confirmed = window.confirm(
              'ნამდვილად გსურს მიმდინარე მატჩის თავიდან დაწყება (0:0)?'
            );
            if (confirmed) {
              onResetCurrentMatch();
              onClose();
            }
          }}
          className="w-full py-2.5 rounded-2xl bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          მიმდინარე მატჩის თავიდან დაწყება (0:0)
        </button>
      )}

      {isMatchInProgress && (
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-amber-900/40 hover:bg-amber-800/60 border border-amber-600/50 text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <X className="w-4 h-4 text-amber-400" />
          მიმდინარე თამაშის გაგრძელება (დაფაზე დაბრუნება)
        </button>
      )}

      {onOpenInstall && (
        <button
          onClick={() => {
            onClose();
            onOpenInstall();
          }}
          className="w-full py-2.5 rounded-2xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-600/50 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          დაამატე აიფონის ეკრანზე (PWA / Add to Home Screen)
        </button>
      )}
    </div>
  );

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2d180d] to-[#150a04] border-t-2 sm:border-2 sm:border-4 border-amber-600/60 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-amber-100 max-h-[88vh] sm:max-h-[90vh] safe-pb animate-sheet-up sm:animate-fade-in">
        {/* iOS Grab Handle for Mobile (Tap to close) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="დახურვა"
          className="w-full pt-3 pb-1 flex items-center justify-center sm:hidden shrink-0 active:opacity-60 cursor-pointer group"
        >
          <div className="w-12 h-1.5 rounded-full bg-amber-600/70 group-hover:bg-amber-500 transition" />
        </button>

        {/* Header Tabs */}
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3.5 border-b border-amber-900/40 bg-black/40 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setTab('NEW_GAME')}
              className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition whitespace-nowrap ${
                tab === 'NEW_GAME'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-black/40 text-amber-300/70 hover:bg-black/60'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              ახალი თამაში
            </button>

            <button
              type="button"
              onClick={() => setTab('SETTINGS')}
              className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition whitespace-nowrap ${
                tab === 'SETTINGS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-black/40 text-amber-300/70 hover:bg-black/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              პარამეტრები
            </button>

            <button
              type="button"
              onClick={() => setTab('STATS')}
              className={`shrink-0 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition whitespace-nowrap ${
                tab === 'STATS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-black/40 text-amber-300/70 hover:bg-black/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              სტატისტიკა
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="დახურვა"
            className="p-2 sm:p-2.5 rounded-xl bg-amber-950/70 hover:bg-amber-900 border border-amber-700/60 text-amber-200 hover:text-white transition shrink-0 z-10 shadow active:scale-95 flex items-center justify-center ml-1"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto allow-scroll flex-1 space-y-5 sm:space-y-6">
          {tab === 'NEW_GAME' ? (
            renderNewMatchSection()
          ) : tab === 'SETTINGS' ? (
            <>
              {/* Theme Selector Section */}
              <div className="bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" /> დაფის თემა და დიზაინი (5 თემა)
                  </h3>
                  <span className="text-[11px] text-amber-400/90 font-bold hidden sm:inline">
                    {BOARD_THEMES[settings.boardTheme || 'CLASSIC_WALNUT']?.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {THEME_ORDER.map((tId) => {
                    const themeConfig = BOARD_THEMES[tId];
                    const isSelected = (settings.boardTheme || 'CLASSIC_WALNUT') === tId;

                    return (
                      <button
                        key={tId}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({ boardTheme: tId });
                          haptics.trigger('selection');
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-1 ring-amber-400 shadow-md'
                            : 'bg-black/40 border-amber-900/40 hover:bg-black/60 hover:border-amber-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl sm:text-2xl shrink-0">{themeConfig.badge}</span>
                          <div className="flex flex-col min-w-0">
                            <span className={`text-xs sm:text-sm font-black truncate ${isSelected ? 'text-amber-200' : 'text-amber-100'}`}>
                              {themeConfig.name}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-amber-300/60 truncate">
                              {themeConfig.subtitle}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {/* 4-color palette swatch preview */}
                          <div className="flex items-center -space-x-1.5 p-1 rounded-lg bg-black/60 border border-white/10 shadow-inner">
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                              style={{ backgroundColor: themeConfig.previewColors.frame }}
                              title="ჩარჩო"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                              style={{ backgroundColor: themeConfig.previewColors.field }}
                              title="მოედანი"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                              style={{ backgroundColor: themeConfig.previewColors.point }}
                              title="ისარი"
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-sm"
                              style={{ backgroundColor: themeConfig.previewColors.accent }}
                              title="ორნამენტი"
                            />
                          </div>

                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center font-bold">
                              <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Audio & Haptics Settings */}
              <div className="bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-amber-900/40 space-y-3">
                <h3 className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> ხმა და ჰაპტიკა (შეხების ვიბრაცია)
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm">ხმოვანი ეფექტები (Web Audio API)</span>
                  <button
                    onClick={() => {
                      const next = !settings.soundEnabled;
                      onUpdateSettings({ soundEnabled: next });
                      if (next) {
                        sounds.playClick();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                      settings.soundEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-950 text-red-300 border border-red-600'
                    }`}
                  >
                    {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    {settings.soundEnabled ? 'ჩართულია' : 'გამორთულია'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/30">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">ჰაპტიკური უკუკავშირი (ვიბრაცია)</div>
                    <div className="text-[11px] text-amber-300/60">
                      ტაქტილური შეხება ქვების აღებისას, სვლისა და კამათლის გაგორებისას
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        hapticFeedbackEnabled: !(settings.hapticFeedbackEnabled ?? true),
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      (settings.hapticFeedbackEnabled ?? true)
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black/50 text-amber-300/70 border border-amber-800/40'
                    }`}
                  >
                    {(settings.hapticFeedbackEnabled ?? true) ? 'ჩართულია' : 'გამორთულია'}
                  </button>
                </div>

                {settings.soundEnabled && (
                  <div className="flex items-center justify-between gap-4 pt-2 border-t border-amber-900/30">
                    <span className="text-xs text-amber-300/70">ხმის სიმძლავრე</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={settings.soundVolume}
                      onChange={(e) =>
                        onUpdateSettings({ soundVolume: parseFloat(e.target.value) })
                      }
                      className="w-36 sm:w-40 accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Georgian Backgammon Rules Options */}
              <div className="bg-black/30 p-3.5 sm:p-4 rounded-2xl border border-amber-900/40 space-y-3">
                <h3 className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4" /> ქართული წესების პარამეტრები
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">სწრაფი სვლა ერთი შეხებით (1-Tap Move)</div>
                    <div className="text-[11px] text-amber-300/60">
                      თუ ქვისთვის მხოლოდ 1 სამიზნეა, სვლა სრულდება 1 დაჭერით
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        singleTapMoveEnabled: !settings.singleTapMoveEnabled,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      settings.singleTapMoveEnabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black/50 text-amber-300/70 border border-amber-800/40'
                    }`}
                  >
                    {settings.singleTapMoveEnabled ? 'ჩართულია' : 'გამორთულია'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/30">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">დავზე მარსი ითვლება (ორმაგდება)</div>
                    <div className="text-[11px] text-amber-300/60">
                      სპორტული წესი: მოგებული ქულა = ფსონი × 2
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({ countMarsOnDavi: !settings.countMarsOnDavi })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      settings.countMarsOnDavi
                        ? 'bg-amber-600 text-white'
                        : 'bg-black/50 text-amber-300/50 border border-amber-800/40'
                    }`}
                  >
                    {settings.countMarsOnDavi ? 'კი (სპორტული)' : 'არა (ეზოს წესი)'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/30">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">კარში მოკვლა და დაფარვა (დამალვა)</div>
                    <div className="text-[11px] text-amber-300/60">
                      მოკვლის შემდეგ ქვის დაფარვა ან წინ წაყვანა
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({
                        allowHitAndCoverInHome: !settings.allowHitAndCoverInHome,
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      settings.allowHitAndCoverInHome
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black/50 text-amber-300/70 border border-amber-800/40'
                    }`}
                  >
                    {settings.allowHitAndCoverInHome ? 'დაშვებულია' : 'აკრძალულია (ღია)'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/30">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">ისრების ნუმერაციის სტილი</div>
                    <div className="text-[11px] text-amber-300/60">
                      ტრადიციული ქართული (1–6) ან სრული (1–24)
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({ showPointNumbers: !settings.showPointNumbers })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      settings.showPointNumbers
                        ? 'bg-amber-600 text-white'
                        : 'bg-black/50 text-amber-300 border border-amber-800/40'
                    }`}
                  >
                    {settings.showPointNumbers ? 'ქართული (1–6)' : 'სრული (1–24)'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/30">
                  <div>
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>ავტომატური გამოსვლა (Auto Bear-Off)</span>
                    </div>
                    <div className="text-[11px] text-amber-300/60">
                      როდესაც ყველა ქვა სახლშია, ავტო-გამოსვლა ავტომატურად გააქტიურდება
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({ autoBearOff: !settings.autoBearOff })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      settings.autoBearOff
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black/50 text-amber-300/70 border border-amber-800/40'
                    }`}
                  >
                    {settings.autoBearOff ? 'ჩართულია' : 'გამორთულია'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-amber-900/30">
                  <div>
                    <div className="text-xs sm:text-sm font-bold">სვლის ავტომატური დასრულება</div>
                    <div className="text-[11px] text-amber-300/60">
                      თუ გამორთულია, ბოლო კამათლის შემდეგ შეგიძლია Undo-ს დაჭერა
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateSettings({ autoConfirmTurn: !settings.autoConfirmTurn })
                    }
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      settings.autoConfirmTurn
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black/50 text-amber-300/70 border border-amber-800/40'
                    }`}
                  >
                    {settings.autoConfirmTurn ? 'ავტომატური' : 'დადასტურებით'}
                  </button>
                </div>
              </div>

              {/* Start New Custom Match */}
              {renderNewMatchSection()}
            </>
          ) : (
            <>
              {/* General Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div className="bg-black/30 p-3 rounded-2xl border border-amber-900/40 text-center">
                  <div className="text-2xl font-black text-white">{stats.gamesPlayed}</div>
                  <div className="text-xs text-amber-300/70">ხელი ჩატარდა</div>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-amber-900/40 text-center">
                  <div className="text-2xl font-black text-emerald-400">{winRate}%</div>
                  <div className="text-xs text-amber-300/70">მოგების მაჩვენებელი</div>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-amber-900/40 text-center">
                  <div className="text-2xl font-black text-amber-400">{stats.marsWon}</div>
                  <div className="text-xs text-amber-300/70">მოგებული მარსი</div>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-purple-900/40 text-center">
                  <div className="text-2xl font-black text-purple-400">{stats.koksiWon || 0}</div>
                  <div className="text-xs text-purple-300/70">მოგებული კოქსი (3x)</div>
                </div>
                <div className="bg-black/30 p-3 rounded-2xl border border-amber-900/40 text-center col-span-2 sm:col-span-1">
                  <div className="text-2xl font-black text-red-400">{stats.daviWon}</div>
                  <div className="text-xs text-amber-300/70">დავით მოგებული</div>
                </div>
              </div>

              {/* Dice Fair Randomness Distribution */}
              <div className="bg-black/30 p-4 rounded-2xl border border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                    <Dices className="w-4 h-4" /> კამათლის სამართლიანობა (RNG სიხშირე)
                  </h3>
                  <span className="text-xs text-amber-300/60">
                    სულ გაგორდა: {totalRolls}
                  </span>
                </div>

                <p className="text-xs text-amber-200/70 leading-relaxed">
                  კამათელი გენერირდება კრიპტოგრაფიულად სამართლიანი ალგორითმით (
                  <code className="text-amber-400">crypto.getRandomValues</code>
                  ). ქვემოთ მოცემულია გაგორებული კამათლების რეალური სიხშირე:
                </p>

                {totalRolls === 0 ? (
                  <div className="text-center py-6 text-xs text-amber-400/50">
                    ჯერ არცერთი კამათელი არ გაგორებულა
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {Object.entries(stats.diceRollsCount)
                      .sort((a, b) => b[1] - a[1])
                      .map(([key, count]) => {
                        const pct = Math.round((count / totalRolls) * 100);
                        return (
                          <div
                            key={key}
                            className="bg-[#241107] p-2 rounded-xl border border-amber-900/30 flex items-center justify-between text-xs"
                          >
                            <span className="font-extrabold text-amber-300">🎲 {key}</span>
                            <div className="text-right">
                              <span className="font-mono text-white font-bold">{count}</span>
                              <span className="text-[10px] text-amber-400/60 ml-1">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Sticky Footer / Close & Return to Game */}
        <div className="p-3 sm:p-4 border-t border-amber-900/40 bg-black/60 backdrop-blur-sm shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-950/90 to-amber-900/90 hover:bg-amber-800 border border-amber-600/60 text-amber-200 hover:text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-98"
          >
            <ChevronDown className="w-4 h-4 sm:hidden" />
            <X className="w-4 h-4 hidden sm:inline" />
            <span>დახურვა (დაფაზე დაბრუნება)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
