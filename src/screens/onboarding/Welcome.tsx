import React from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { BuddyLogo } from '../../components/BuddyLogo';

interface WelcomeProps {
  onNext: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNext }) => {
  const { t } = useT();

  return (
    <div className="flex flex-col h-full bg-[#F4F8F8] text-[#16302F] justify-between p-6 select-none">
      {/* Top bar with Buddy logo wordmark and language toggle */}
      <div className="flex items-center justify-between pt-2">
        <BuddyLogo size="sm" showWordmark={true} />
        <LangToggle />
      </div>

      {/* Main card */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto">
        <div className="mb-2">
          <BuddyLogo size="xl" showWordmark={false} />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#16302F]">
          {t('welcomeTitle')}
        </h1>
        <p className="text-gray-600 max-w-[280px] text-base leading-relaxed">
          {t('welcomeSubtitle')}
        </p>
      </div>

      {/* Action button */}
      <div className="pb-4">
        <button
          type="button"
          onClick={onNext}
          className="w-full h-12 bg-[#2F6F73] hover:bg-[#255a5d] active:bg-[#1f4a4c] text-white font-semibold rounded-2xl shadow-md transition-all tap-target flex items-center justify-center text-base"
        >
          {t('getStarted')}
        </button>
      </div>
    </div>
  );
};
