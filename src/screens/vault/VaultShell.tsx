import React, { useState, useRef } from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { lockNow } from '../../lib/panic';
import { Record } from './Record';
import { Timeline } from './Timeline';
import { Sahayata } from './Sahayata';
import { Settings } from './Settings';
import { Lock, Mic, Clock, HeartHandshake, Settings as SettingsIcon } from 'lucide-react';

export const VaultShell: React.FC = () => {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<'record' | 'timeline' | 'sahayata' | 'settings'>('record');

  // Top-left double-tap tracker
  const lastTopLeftTapRef = useRef<number>(0);

  const handleTopLeftTap = () => {
    const now = Date.now();
    if (now - lastTopLeftTapRef.current <= 400) {
      lockNow('top-left-double-tap');
      lastTopLeftTapRef.current = 0;
    } else {
      lastTopLeftTapRef.current = now;
    }
  };

  // Three-finger tap trigger
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 3) {
      lockNow('three-finger-tap');
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      className="flex flex-col h-full w-full bg-[#F4F8F8] text-[#16302F] select-none overflow-hidden relative"
    >
      {/* Persistent Top Bar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-teal-100/80 shadow-sm shrink-0 z-20">
        {/* Left: Lock Button & Top-Left Double-Tap Target */}
        <div className="flex items-center gap-1.5" onClick={handleTopLeftTap}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              lockNow('manual');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#2F6F73] font-semibold text-xs border border-teal-200 shadow-sm transition-all tap-target"
            aria-label="Lock Vault"
          >
            <Lock className="w-3.5 h-3.5 text-[#2F6F73]" />
            <span>{t('lock')}</span>
          </button>
        </div>

        {/* Center Title */}
        <h1 className="font-heading font-semibold text-base text-[#16302F] tracking-tight">
          {t('vaultTitle')}
        </h1>

        {/* Right: Language Toggle */}
        <div className="flex items-center">
          <LangToggle />
        </div>
      </header>

      {/* Main Tab Screen Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">
        {activeTab === 'record' && <Record />}
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'sahayata' && <Sahayata />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Bottom Tab Bar (4 tabs) */}
      <nav className="flex items-center justify-around bg-white border-t border-teal-100 px-2 py-1 shrink-0 z-20 shadow-md">
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all tap-target ${
            activeTab === 'record'
              ? 'text-[#2F6F73] font-bold'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <Mic className={`w-5 h-5 ${activeTab === 'record' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-0.5">{t('tabRecord')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all tap-target ${
            activeTab === 'timeline'
              ? 'text-[#2F6F73] font-bold'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <Clock className={`w-5 h-5 ${activeTab === 'timeline' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-0.5">{t('tabTimeline')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sahayata')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all tap-target ${
            activeTab === 'sahayata'
              ? 'text-[#2F6F73] font-bold'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <HeartHandshake className={`w-5 h-5 ${activeTab === 'sahayata' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-0.5">{t('tabSahayata')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 rounded-xl transition-all tap-target ${
            activeTab === 'settings'
              ? 'text-[#2F6F73] font-bold'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          <SettingsIcon className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] mt-0.5">{t('tabSettings')}</span>
        </button>
      </nav>
    </div>
  );
};
