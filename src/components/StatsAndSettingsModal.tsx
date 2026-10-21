import React, { useState } from 'react';
import { AIDifficulty, GameMode, GameSettings, GameStats } from '../engine/types';
import { BarChart3, Settings, Volume2, VolumeX, X, PlayCircle, Dices, Award } from 'lucide-react';

interface StatsAndSettingsModalProps {
  isOpen: boolean;
  activeTab: 'STATS' | 'SETTINGS';
  stats: GameStats;
  settings: GameSettings;
  gameMode: GameMode;
  quickDifficulty: AIDifficulty;
  quickTargetScore: number;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onStartNewMatch: (mode: GameMode, difficulty: AIDifficulty, targetScore: number) => void;
}

export const StatsAndSettingsModal: React.FC<StatsAndSettingsModalProps> = ({
  isOpen,
  activeTab: initialTab,
  stats,
  settings,
  gameMode,
  quickDifficulty,
  quickTargetScore,
  onClose,
  onUpdateSettings,
  onStartNewMatch,
}) => {
  const [tab, setTab] = useState<'STATS' | 'SETTINGS'>(initialTab);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#2d180d] to-[#150a04] border-2 sm:border-4 border-amber-600/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-amber-100 max-h-[90vh]">
        {/* Header Tabs */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900/40 bg-black/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('SETTINGS')}
              className={`px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition ${
                tab === 'SETTINGS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-black/30 text-amber-300/70 hover:bg-black/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              პარამეტრები
            </button>

            <button
              onClick={() => setTab('STATS')}
              className={`px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 transition ${
                tab === 'STATS'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-black/30 text-amber-300/70 hover:bg-black/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              სტატისტიკა & კამათელი
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/40 hover:bg-black/60 border border-amber-800/40 text-amber-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {tab === 'SETTINGS' ? (
            <>
              {/* Audio Settings */}
              <div className="bg-black/30 p-4 rounded-2xl border border-amber-900/40 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> ხმა და აუდიო ეფექტები
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm">ხმოვანი ეფექტები (Web Audio API)</span>
                  <button
                    onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
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

                {settings.soundEnabled && (
                  <div className="flex items-center justify-between gap-4 pt-2">
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
                      className="w-40 accent-amber-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Georgian Backgammon Rules Options */}
              <div className="bg-black/30 p-4 rounded-2xl border border-amber-900/40 space-y-3">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4" /> ქართული წესების პარამეტრები
                </h3>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold">დავზე მარსი ითვლება (ორმაგდება)</div>
                    <div className="text-xs text-amber-300/60">
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
                    <div className="text-sm font-bold">კარში მოკვლა და დაფარვა (დამალვა)</div>
                    <div className="text-xs text-amber-300/60">
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
                    <div className="text-sm font-bold">ისრების ნუმერაციის სტილი</div>
                    <div className="text-xs text-amber-300/60">
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
                    <div className="text-sm font-bold">სვლის ავტომატური დასრულება</div>
                    <div className="text-xs text-amber-300/60">
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
              <div className="bg-black/30 p-4 rounded-2xl border border-amber-900/40 space-y-4">
                <h3 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" /> ახალი თამაშის წამოწყება
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
                    onStartNewMatch(selectedMode, selectedDiff, selectedTarget);
                    onClose();
                  }}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 transform active:scale-95 transition"
                >
                  <PlayCircle className="w-5 h-5" /> ახალი მატჩის დაწყება
                </button>
              </div>
            </>
          ) : (
            <>
              {/* General Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                <div className="bg-black/30 p-3 rounded-2xl border border-amber-900/40 text-center">
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
      </div>
    </div>
  );
};
