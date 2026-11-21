import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Volume2, Grid } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { useDemoLogStore } from '../../store/demoLogStore';
import { useT } from '../../i18n/useT';

export const ActiveCall: React.FC = () => {
  const { t } = useT();
  const fakeCallerName = useAppStore((s) => s.fakeCallerName) || 'Maa';
  const returnTo = useAppStore((s) => s.returnTo) || 'cover';
  const setScreen = useAppStore((s) => s.setScreen);
  const addLog = useDemoLogStore((s) => s.addLog);

  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    addLog(`Fake call with ${fakeCallerName} ended after ${formatDuration(seconds)}`, 'info');
    setScreen(returnTo);
  };

  const initials = fakeCallerName
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'M';

  return (
    <div
      className="flex flex-col h-full w-full bg-[#111111] text-white select-none relative justify-between p-8 overflow-hidden font-sans"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Top Section: Active Call Info */}
      <div className="flex flex-col items-center pt-10 space-y-2">
        <div className="w-20 h-20 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-2xl font-semibold text-neutral-300 shadow-md mb-2">
          {initials}
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          {fakeCallerName}
        </h2>
        <p className="text-sm font-mono text-neutral-400 tracking-wider">
          {formatDuration(seconds)}
        </p>
      </div>

      {/* Middle Section: Decorative in-call controls */}
      <div className="grid grid-cols-3 gap-6 my-auto px-4 max-w-xs mx-auto w-full">
        {/* Mute */}
        <button
          type="button"
          onClick={() => setIsMuted(!isMuted)}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all tap-target ${
            isMuted ? 'bg-white text-black' : 'bg-neutral-800/80 text-white hover:bg-neutral-700'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6 mb-1" /> : <Mic className="w-6 h-6 mb-1" />}
          <span className="text-[11px] font-medium">{t('callMute')}</span>
        </button>

        {/* Keypad */}
        <button
          type="button"
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-neutral-800/80 text-white hover:bg-neutral-700 transition-all tap-target opacity-80"
        >
          <Grid className="w-6 h-6 mb-1" />
          <span className="text-[11px] font-medium">{t('callKeypad')}</span>
        </button>

        {/* Speaker */}
        <button
          type="button"
          onClick={() => setIsSpeaker(!isSpeaker)}
          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all tap-target ${
            isSpeaker ? 'bg-white text-black' : 'bg-neutral-800/80 text-white hover:bg-neutral-700'
          }`}
        >
          <Volume2 className="w-6 h-6 mb-1" />
          <span className="text-[11px] font-medium">{t('callSpeaker')}</span>
        </button>
      </div>

      {/* Bottom Section: End Call Button */}
      <div className="flex flex-col items-center pb-8">
        <button
          type="button"
          onClick={handleEndCall}
          className="w-16 h-16 rounded-full bg-[#E5484D] hover:bg-[#d63d42] active:scale-95 text-white flex items-center justify-center shadow-xl transition-transform tap-target"
          aria-label={t('callEnd')}
        >
          <PhoneOff className="w-7 h-7" />
        </button>
        <span className="text-xs text-neutral-400 font-medium mt-2">{t('callEnd')}</span>
      </div>
    </div>
  );
};
