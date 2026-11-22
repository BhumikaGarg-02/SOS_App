import React, { useState, useEffect } from 'react';
import { useT } from '../../i18n/useT';
import { useAppStore } from '../../store/appStore';
import { getGuardians, resetDatabase, type GuardianRecord } from '../../lib/db';
import { clearAllTamperBackups } from '../../lib/tamperDemo';
import { LangToggle } from '../../components/LangToggle';
import { EmailConfigSection } from '../../components/EmailConfigSection';
import {
  Clock,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  Info,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { t } = useT();
  const timerMode = useAppStore((s) => s.timerMode);
  const setTimerMode = useAppStore((s) => s.setTimerMode);
  const fakeCallerName = useAppStore((s) => s.fakeCallerName);
  const setFakeCallerName = useAppStore((s) => s.setFakeCallerName);

  const [guardians, setGuardians] = useState<GuardianRecord[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<'Maa' | 'Didi' | 'Office Manager' | 'Custom'>(() => {
    if (fakeCallerName === 'Maa' || fakeCallerName === 'Didi' || fakeCallerName === 'Office Manager') {
      return fakeCallerName;
    }
    return 'Custom';
  });
  const [customName, setCustomName] = useState(
    fakeCallerName === 'Maa' || fakeCallerName === 'Didi' || fakeCallerName === 'Office Manager' ? '' : fakeCallerName
  );
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    getGuardians().then(setGuardians);
  }, []);

  const handleSelectPreset = (p: 'Maa' | 'Didi' | 'Office Manager' | 'Custom') => {
    setSelectedPreset(p);
    if (p !== 'Custom') {
      setFakeCallerName(p);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2000);
    } else {
      if (customName.trim()) {
        setFakeCallerName(customName.trim());
      }
    }
  };

  const handleCustomChange = (val: string) => {
    setCustomName(val);
    setFakeCallerName(val.trim() || 'Maa');
  };

  const handleSaveCustom = () => {
    setFakeCallerName(customName.trim() || 'Maa');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleResetApp = async () => {
    if (window.confirm(t('resetConfirm'))) {
      localStorage.clear();
      await clearAllTamperBackups();
      await resetDatabase();
      window.location.reload();
    }
  };

  const presets: Array<{ label: string; val: 'Maa' | 'Didi' | 'Office Manager' | 'Custom' }> = [
    { label: t('presetMaa'), val: 'Maa' },
    { label: t('presetDidi'), val: 'Didi' },
    { label: t('presetOfficeManager'), val: 'Office Manager' },
    { label: t('presetCustom'), val: 'Custom' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 select-none text-gray-800">
      <div className="flex items-center justify-between pb-1">
        <h2 className="font-heading text-xl font-bold text-[#16302F]">
          {t('settingsTitle')}
        </h2>
      </div>

      {/* 1. Language Option */}
      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2F6F73]" />
            <span className="text-xs font-semibold text-gray-700">
              {t('languageOption')}
            </span>
          </div>
          <LangToggle />
        </div>
      </div>

      {/* 2. Dead-Man Timer Mode */}
      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-[#16302F]">
          <Clock className="w-4 h-4 text-[#2F6F73]" />
          <span className="text-xs font-semibold text-gray-700">
            {t('timerModeTitle')}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTimerMode('real')}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all tap-target flex items-center justify-center ${
              timerMode === 'real'
                ? 'bg-teal-50 border-[#2F6F73] text-[#2F6F73] shadow-sm'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('timerReal15Min')}
          </button>
          <button
            type="button"
            onClick={() => setTimerMode('demo')}
            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all tap-target flex items-center justify-center ${
              timerMode === 'demo'
                ? 'bg-teal-50 border-[#2F6F73] text-[#2F6F73] shadow-sm'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t('timerDemo15Sec')}
          </button>
        </div>
      </div>

      {/* 3. Fake Call Caller Name */}
      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-[#16302F]">
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#2F6F73]" />
            <span className="text-xs font-semibold text-gray-700">
              {t('fakeCallerNameTitle')}
            </span>
          </div>
          {savedNotice && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {t('defaultSavedNotice')}
            </span>
          )}
        </div>

        {/* Preset Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((p) => {
            const isSelected = selectedPreset === p.val;
            return (
              <button
                key={p.val}
                type="button"
                onClick={() => handleSelectPreset(p.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all tap-target ${
                  isSelected
                    ? 'bg-[#2F6F73] text-white border-[#2F6F73] shadow-xs'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Small text input when Custom is selected */}
        {selectedPreset === 'Custom' && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customName}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder={t('customCallerPlaceholder')}
              className="flex-1 h-10 px-3 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#2F6F73] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSaveCustom}
              className="px-3 h-10 rounded-xl bg-[#2F6F73] hover:bg-[#255a5d] text-white text-xs font-semibold tap-target shadow-2xs"
            >
              {t('save')}
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-400">
          Default caller: <span className="font-semibold text-gray-700">{fakeCallerName || 'Maa'}</span>
        </p>
      </div>

      {/* 4. Active Emergency Guardians */}
      <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-[#16302F]">
          <Users className="w-4 h-4 text-[#2F6F73]" />
          <span className="text-xs font-semibold text-gray-700">
            {t('guardiansListTitle')}
          </span>
        </div>
        <div className="space-y-2">
          {guardians.length === 0 ? (
            <p className="text-xs text-gray-400">No guardians registered.</p>
          ) : (
            guardians.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100"
              >
                <div>
                  <div className="text-xs font-bold text-gray-800">{g.name}</div>
                  <div className="text-[11px] text-gray-500">
                    {g.relation} • {g.contact}
                  </div>
                </div>
                {g.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {t('verified')}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. Email Alerts (EmailJS) Section */}
      <EmailConfigSection compact={true} />

      {/* 5. Reset App */}
      <div className="bg-red-50/70 p-4 rounded-2xl border border-red-200 space-y-2">
        <div className="flex items-center gap-2 text-red-900 font-semibold text-xs">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>{t('resetAppTitle')}</span>
        </div>
        <p className="text-[11px] text-red-800 leading-relaxed">
          {t('resetAppDesc')}
        </p>
        <button
          type="button"
          onClick={handleResetApp}
          className="w-full h-11 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          {t('resetAppBtn')}
        </button>
      </div>

      {/* Footer Notices */}
      <div className="pt-2 pb-4 space-y-3 text-center">
        <div className="flex items-start gap-2 bg-teal-50/50 p-3 rounded-xl border border-teal-100 text-left">
          <Info className="w-4 h-4 text-[#2F6F73] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#16302F] leading-relaxed">
            {t('aboutSealNotice')}
          </p>
        </div>

        <p className="text-[10px] text-gray-500 leading-relaxed max-w-xs mx-auto">
          {t('footerLegalNotice')}
        </p>
      </div>
    </div>
  );
};
