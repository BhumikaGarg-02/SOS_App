import React, { useState } from 'react';
import { LangToggle } from '../../components/LangToggle';
import { useT } from '../../i18n/useT';
import { useAppStore, type CoverType } from '../../store/appStore';
import { BuddyLogo } from '../../components/BuddyLogo';
import { ShoppingCart, GraduationCap, Heart, CheckCircle2 } from 'lucide-react';

interface ChooseCoverProps {
  onBack: () => void;
}

export const ChooseCover: React.FC<ChooseCoverProps> = ({ onBack }) => {
  const { t } = useT();
  const setCover = useAppStore((s) => s.setCover);
  const setSetupComplete = useAppStore((s) => s.setSetupComplete);
  const setScreen = useAppStore((s) => s.setScreen);

  const [selected, setSelected] = useState<CoverType>('grocery');

  const handleFinish = async () => {
    setCover(selected);
    setSetupComplete(true);

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        await navigator.storage.persist();
      } catch (e) {
        console.warn('Storage persist request ignored:', e);
      }
    }

    setScreen('cover');
  };

  const covers = [
    {
      id: 'grocery' as CoverType,
      title: t('coverGkTitle'),
      desc: t('coverGkDesc'),
      icon: ShoppingCart,
      primaryColor: '#E07A2F',
      bgColor: '#FFF6EA',
      textColor: '#3B2A1A',
    },
    {
      id: 'cgpa' as CoverType,
      title: t('coverCgpaTitle'),
      desc: t('coverCgpaDesc'),
      icon: GraduationCap,
      primaryColor: '#3F6FD8',
      bgColor: '#F2F6FF',
      textColor: '#1B2440',
    },
    {
      id: 'wellness' as CoverType,
      title: t('coverCycleTitle'),
      desc: t('coverCycleDesc'),
      icon: Heart,
      primaryColor: '#E88AA6',
      bgColor: '#FFF3F7',
      textColor: '#4A2B38',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F4F8F8] text-[#16302F] justify-between p-5 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 shrink-0">
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
      <div className="space-y-4 my-auto">
        <div>
          <h2 className="font-heading text-2xl font-bold">{t('chooseCoverTitle')}</h2>
          <p className="text-xs text-gray-500 mt-1">{t('chooseCoverSubtitle')}</p>
        </div>

        {/* 3 Live Preview Cards */}
        <div className="space-y-3">
          {covers.map((c) => {
            const isSelected = selected === c.id;
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex items-start gap-3.5 shadow-sm ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-600/20 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{ backgroundColor: c.bgColor }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: c.primaryColor, color: '#FFFFFF' }}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 pr-6" style={{ color: c.textColor }}>
                  <div className="font-heading font-bold text-base">{c.title}</div>
                  <div className="text-xs opacity-80 mt-0.5 leading-relaxed">{c.desc}</div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Finish Button */}
      <div className="pb-4 pt-4 shrink-0">
        <button
          type="button"
          onClick={handleFinish}
          className="w-full h-12 bg-[#2F6F73] hover:bg-[#255a5d] text-white font-semibold rounded-2xl shadow-md transition-all tap-target flex items-center justify-center text-base"
        >
          {t('finishSetup')}
        </button>
      </div>
    </div>
  );
};
