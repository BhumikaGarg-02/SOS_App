import React, { useState, useEffect } from 'react';
import { CoverShell } from '../../components/CoverShell';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import { check as checkPin } from '../../lib/pinGuard';
import { silentSOS } from '../../lib/sos';
import { arm as armDeadman, disarm as disarmDeadman, isArmed } from '../../lib/deadman';
import { Droplet, Plus, Minus, X } from 'lucide-react';

export const WellnessTracker: React.FC = () => {
  const { t } = useT();
  const setScreen = useAppStore((s) => s.setScreen);
  const setUnlocked = useAppStore((s) => s.setUnlocked);
  const startFakeCall = useAppStore((s) => s.startFakeCall);

  // Persisted cycle day and cycle length
  const [cycleDay, setCycleDay] = useState<number>(() => {
    const saved = localStorage.getItem('chuppi_cycle_day');
    return saved ? parseInt(saved, 10) : 14;
  });
  const cycleLength = 28;

  // Persisted hydration
  const [waterCount, setWaterCount] = useState<number>(() => {
    const saved = localStorage.getItem('chuppi_cycle_water');
    return saved ? parseInt(saved, 10) : 5;
  });

  // Persisted mood
  const [selectedMood, setSelectedMood] = useState<number>(() => {
    const saved = localStorage.getItem('chuppi_cycle_mood');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Dial modal state
  const [isDialOpen, setIsDialOpen] = useState(false);
  const [dialInput, setDialInput] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    localStorage.setItem('chuppi_cycle_day', String(cycleDay));
  }, [cycleDay]);

  useEffect(() => {
    localStorage.setItem('chuppi_cycle_water', String(waterCount));
  }, [waterCount]);

  useEffect(() => {
    localStorage.setItem('chuppi_cycle_mood', String(selectedMood));
  }, [selectedMood]);

  // Hydration change + dead-man triggers
  const handleWaterChange = (delta: number) => {
    const next = Math.max(0, Math.min(20, waterCount + delta));
    setWaterCount(next);

    // Dead-man: water set to exactly 15 arms silently
    if (next === 15) {
      armDeadman('wellness');
    }
    // Dead-man: water set to exactly 8 while armed disarms
    if (next === 8 && isArmed()) {
      disarmDeadman('wellness');
    }
  };

  // Dial submit handler
  const handleDialSubmit = async () => {
    const raw = dialInput.trim();

    // 1. PIN trigger: exactly 4 digits
    if (/^\d{4}$/.test(raw)) {
      const pinResult = await checkPin(raw);
      setDialInput('');

      if (pinResult === 'REAL') {
        setIsDialOpen(false);
        setUnlocked(true);
        setScreen('vault');
        return;
      } else if (pinResult === 'DECOY') {
        setIsDialOpen(false);
        await silentSOS('decoy_pin');
        setScreen('fakeVault');
        return;
      }
      // If IGNORED or NONE: close dial with gentle shake and nothing more
      triggerShakeAndClose();
      return;
    }

    // 2. 1 to 2 digit entry between 1 and 40 saves as cycle day
    if (/^\d{1,2}$/.test(raw)) {
      const num = parseInt(raw, 10);
      if (num >= 1 && num <= 40) {
        setCycleDay(num);
        setIsDialOpen(false);
        setDialInput('');
        return;
      }
    }

    // 3. Anything else: closes the dial with a gentle shake and nothing more
    triggerShakeAndClose();
  };

  const triggerShakeAndClose = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setIsDialOpen(false);
      setDialInput('');
    }, 400);
  };

  const moods = ['😊', '😐', '😔', '😡', '😴'];
  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayIndex = 2; // Wednesday example

  const progressPct = Math.min(100, Math.round((cycleDay / cycleLength) * 100));
  const strokeDashoffset = 283 - (283 * progressPct) / 100;

  return (
    <CoverShell
      title={t('cycleHeading')}
      bgColor="#FFF3F7"
      headerBgColor="#FFF3F7"
      headerTextColor="#4A2B38"
      onDoubleTapHotZone={() => startFakeCall(5000)}
      onDoubleTap={() => startFakeCall(5000)}
    >
      <div className="flex-1 flex flex-col justify-between p-4 select-none overflow-y-auto max-w-md mx-auto w-full">
        {/* Week Strip */}
        <div className="flex justify-between items-center bg-white/80 p-2.5 rounded-2xl border border-pink-100 shadow-sm shrink-0">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`flex flex-col items-center justify-center w-8 h-10 rounded-xl text-xs font-semibold ${
                i === todayIndex
                  ? 'bg-[#E88AA6] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <span className="text-[10px] opacity-75">{d}</span>
              <span>{12 + i}</span>
            </div>
          ))}
        </div>

        {/* Cycle Ring Display */}
        <div className="flex flex-col items-center justify-center my-auto py-2">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Circle Progress */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-pink-100"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-[#E88AA6] transition-all duration-500"
                strokeWidth="7"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Clickable Ring Center -> Opens "Edit cycle day" dial */}
            <button
              type="button"
              onClick={() => {
                setDialInput('');
                setIsDialOpen(true);
              }}
              className="absolute w-32 h-32 rounded-full bg-white shadow-md border border-pink-100 flex flex-col items-center justify-center active:scale-95 transition-all tap-target group"
              title={t('cycleEditDay')}
            >
              <span className="text-[11px] font-semibold text-gray-400 group-hover:text-[#E88AA6]">
                {t('cyclePhase')}
              </span>
              <span className="text-xl font-heading font-bold text-[#4A2B38] mt-0.5">
                {t('cycleDayOf', { current: cycleDay, total: cycleLength })}
              </span>
              <span className="text-[10px] text-pink-400 mt-1 underline">
                {t('cycleEditDay')}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Trackers: Mood & Hydration */}
        <div className="space-y-3 shrink-0">
          {/* Mood Row */}
          <div className="bg-white/90 p-3 rounded-2xl border border-pink-100 shadow-sm">
            <span className="text-xs font-semibold text-gray-700 block mb-2">
              {t('cycleMoodTitle')}
            </span>
            <div className="flex justify-between items-center px-1">
              {moods.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedMood(idx)}
                  className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all tap-target ${
                    selectedMood === idx
                      ? 'bg-pink-100 scale-110 shadow-sm ring-2 ring-[#E88AA6]'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Hydration Counter */}
          <div className="bg-white/90 p-3.5 rounded-2xl border border-pink-100 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#8FB8E8] flex items-center justify-center">
                <Droplet className="w-5 h-5 fill-[#8FB8E8]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-700 block">
                  {t('cycleWaterTitle')}
                </span>
                <span className="text-[11px] text-gray-400">{t('cycleWaterGoal')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleWaterChange(-1)}
                disabled={waterCount <= 0}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 flex items-center justify-center font-bold disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="w-12 text-center">
                <span className="text-lg font-bold text-[#4A2B38] font-mono">{waterCount}</span>
                <span className="text-[10px] text-gray-400 block -mt-1">
                  {t('cycleGlassesUnit')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleWaterChange(1)}
                disabled={waterCount >= 20}
                className="w-9 h-9 rounded-xl bg-pink-100 hover:bg-pink-200 active:scale-95 text-[#4A2B38] flex items-center justify-center font-bold disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Cycle Day Dial Modal */}
      {isDialOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xs bg-white rounded-3xl p-5 shadow-2xl border border-pink-100 transition-all ${
              isShaking ? 'animate-bounce' : ''
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-[#4A2B38]">
                {t('cycleEditDay')}
              </span>
              <button
                type="button"
                onClick={() => setIsDialOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mb-3">{t('cycleDialPrompt')}</p>

            <div className="mb-4">
              <input
                type="text"
                autoFocus
                maxLength={4}
                value={dialInput}
                onChange={(e) => setDialInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleDialSubmit();
                }}
                className="w-full h-12 text-center text-xl font-mono font-bold tracking-widest rounded-2xl border border-gray-300 bg-gray-50 focus:bg-white focus:border-[#E88AA6] focus:outline-none"
                placeholder="Day #"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsDialOpen(false)}
                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDialSubmit}
                className="flex-1 h-11 bg-[#E88AA6] hover:bg-[#d67390] text-white font-semibold rounded-xl text-xs shadow-sm"
              >
                {t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </CoverShell>
  );
};
