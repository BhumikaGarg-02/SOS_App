import React, { useEffect } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { startRingtone, stopRingtone, ensureAudioUnlocked } from '../../lib/ringtone';
import { useDemoLogStore } from '../../store/demoLogStore';
import { useT } from '../../i18n/useT';

export const IncomingCall: React.FC = () => {
  const { t } = useT();
  const fakeCallerName = useAppStore((s) => s.fakeCallerName) || 'Maa';
  const returnTo = useAppStore((s) => s.returnTo) || 'cover';
  const setScreen = useAppStore((s) => s.setScreen);
  const addLog = useDemoLogStore((s) => s.addLog);

  // Ensure audio is unlocked/resumed and start ringtone loop
  useEffect(() => {
    ensureAudioUnlocked();
    startRingtone();
    return () => {
      stopRingtone();
    };
  }, []);

  const handleDecline = () => {
    stopRingtone();
    addLog(`Fake call from ${fakeCallerName} declined`, 'info');
    setScreen(returnTo);
  };

  const handleAccept = () => {
    stopRingtone();
    addLog(`Fake call from ${fakeCallerName} accepted`, 'info');
    setScreen('activeCall');
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
      {/* Top Section: Caller Info */}
      <div className="flex flex-col items-center pt-12 space-y-3">
        {/* Pulsing Avatar */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute w-32 h-32 rounded-full bg-white/10 animate-ping opacity-75" />
          <div className="absolute w-28 h-28 rounded-full bg-white/15" />
          <div className="relative w-24 h-24 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center text-3xl font-semibold text-neutral-200 shadow-xl">
            {initials}
          </div>
        </div>

        {/* Name and Label */}
        <h2 className="text-2xl font-bold tracking-normal text-center text-neutral-100">
          {fakeCallerName} {t('callCallingSuffix')}
        </h2>
        <p className="text-sm text-neutral-400 font-medium tracking-wide">
          {t('callMobileLabel')}
        </p>
      </div>

      {/* Middle Spacer */}
      <div className="flex-1" />

      {/* Bottom Action Buttons: Decline (left) & Accept (right) */}
      <div className="flex items-center justify-around w-full pb-8 px-4">
        {/* Decline */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="w-16 h-16 rounded-full bg-[#E5484D] hover:bg-[#d63d42] active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform tap-target"
            aria-label={t('callDecline')}
          >
            <PhoneOff className="w-7 h-7" />
          </button>
          <span className="text-xs text-neutral-400 font-medium">{t('callDecline')}</span>
        </div>

        {/* Accept */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleAccept}
            className="w-16 h-16 rounded-full bg-[#2ECC71] hover:bg-[#27ae60] active:scale-95 text-white flex items-center justify-center shadow-lg transition-transform animate-bounce tap-target"
            aria-label={t('callAccept')}
          >
            <Phone className="w-7 h-7" />
          </button>
          <span className="text-xs text-neutral-400 font-medium">{t('callAccept')}</span>
        </div>
      </div>
    </div>
  );
};

export const FakeCallOverlay = IncomingCall;
export default IncomingCall;
