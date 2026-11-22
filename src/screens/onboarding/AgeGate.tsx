import React, { useState } from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { ShieldCheck } from 'lucide-react';
import { setSetting } from '../../lib/db';
import { BuddyLogo } from '../../components/BuddyLogo';

interface AgeGateProps {
  onNext: () => void;
  onBack: () => void;
}

export const AgeGate: React.FC<AgeGateProps> = ({ onNext, onBack }) => {
  const { t } = useT();
  const [ageChoice, setAgeChoice] = useState<'18plus' | 'under18'>('18plus');
  const [ackSafety, setAckSafety] = useState(false);
  const [ackNoFalse, setAckNoFalse] = useState(false);
  const [ackGuardian, setAckGuardian] = useState(false);

  const canContinue = ackSafety && ackNoFalse && ackGuardian;

  const handleContinue = async () => {
    if (!canContinue) return;
    await setSetting('ageVerified', true);
    await setSetting('ageChoice', ageChoice);
    onNext();
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F8F8] text-[#16302F] justify-between p-6 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-2 shrink-0">
        <BuddyLogo size="sm" showWordmark={true} />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-500 hover:text-gray-800"
          >
            {t('back')}
          </button>
          <LangToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="my-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#2F6F73] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#2F6F73]" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#16302F]">{t('ageGateTitle')}</h2>
        </div>

        {/* Age radio options */}
        <div className="space-y-2.5">
          <label
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              ageChoice === '18plus'
                ? 'bg-teal-50/70 border-[#2F6F73] ring-1 ring-[#2F6F73]'
                : 'bg-white border-gray-200'
            }`}
          >
            <input
              type="radio"
              name="ageOption"
              checked={ageChoice === '18plus'}
              onChange={() => setAgeChoice('18plus')}
              className="w-4 h-4 text-[#2F6F73] focus:ring-[#2F6F73]"
            />
            <span className="font-medium text-sm text-gray-800">{t('ageGate18Plus')}</span>
          </label>

          <label
            className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              ageChoice === 'under18'
                ? 'bg-teal-50/70 border-[#2F6F73] ring-1 ring-[#2F6F73]'
                : 'bg-white border-gray-200'
            }`}
          >
            <input
              type="radio"
              name="ageOption"
              checked={ageChoice === 'under18'}
              onChange={() => setAgeChoice('under18')}
              className="w-4 h-4 text-[#2F6F73] focus:ring-[#2F6F73]"
            />
            <span className="font-medium text-sm text-gray-800">{t('ageGateUnder18')}</span>
          </label>
        </div>

        {/* 3 Required Checkboxes */}
        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ackSafety}
              onChange={(e) => setAckSafety(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#2F6F73] rounded border-gray-300 focus:ring-[#2F6F73]"
            />
            <span className="text-xs leading-relaxed text-gray-700">
              {t('ackSafetyOnly')}
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ackNoFalse}
              onChange={(e) => setAckNoFalse(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#2F6F73] rounded border-gray-300 focus:ring-[#2F6F73]"
            />
            <span className="text-xs leading-relaxed text-gray-700">
              {t('ackNoFalseAccusation')}
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={ackGuardian}
              onChange={(e) => setAckGuardian(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-[#2F6F73] rounded border-gray-300 focus:ring-[#2F6F73]"
            />
            <span className="text-xs leading-relaxed text-gray-700">
              {t('ackGuardianOnly')}
            </span>
          </label>
        </div>
      </div>

      {/* Continue Button */}
      <div className="pb-4 pt-4 shrink-0">
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className="w-full h-12 bg-[#2F6F73] hover:bg-[#255a5d] disabled:bg-gray-300 disabled:text-gray-500 text-white font-semibold rounded-2xl shadow-sm transition-all tap-target flex items-center justify-center text-base"
        >
          {t('continue')}
        </button>
      </div>
    </div>
  );
};
