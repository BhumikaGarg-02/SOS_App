import React from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { ShoppingCart } from 'lucide-react';

interface WelcomeProps {
  onNext: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onNext }) => {
  const { t } = useT();

  return (
    <div className="flex flex-col h-full bg-[#FFF6EA] text-[#3B2A1A] justify-between p-6 select-none">
      {/* Top bar with language toggle */}
      <div className="flex justify-end pt-2">
        <LangToggle />
      </div>

      {/* Main card */}
      <div className="flex flex-col items-center text-center space-y-4 my-auto">
        <div className="w-20 h-20 rounded-3xl bg-[#E07A2F] text-white flex items-center justify-center shadow-lg shadow-[#E07A2F]/20 mb-2">
          <ShoppingCart className="w-10 h-10" />
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#3B2A1A]">
          {t('welcomeTitle')}
        </h1>
        <p className="text-gray-600 max-w-[260px] text-base leading-relaxed">
          {t('welcomeSubtitle')}
        </p>
      </div>

      {/* Action button */}
      <div className="pb-4">
        <button
          type="button"
          onClick={onNext}
          className="w-full h-12 bg-[#E07A2F] hover:bg-[#c96924] active:bg-[#b55c1e] text-white font-semibold rounded-2xl shadow-md transition-all tap-target flex items-center justify-center text-base"
        >
          {t('getStarted')}
        </button>
      </div>
    </div>
  );
};
