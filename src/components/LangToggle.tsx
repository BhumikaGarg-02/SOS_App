import React from 'react';
import { useAppStore } from '../store/appStore';

export const LangToggle: React.FC = () => {
  const lang = useAppStore((state) => state.lang);
  const setLang = useAppStore((state) => state.setLang);

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="inline-flex h-[32px] p-0.5 rounded-full bg-black/10 text-xs font-medium select-none z-10"
    >
      <button
        type="button"
        onClick={() => setLang('hi')}
        className={`px-2.5 h-full rounded-full transition-all flex items-center justify-center font-hindi ${
          lang === 'hi'
            ? 'bg-white text-gray-900 shadow-sm font-semibold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        हिंदी
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`px-2.5 h-full rounded-full transition-all flex items-center justify-center ${
          lang === 'en'
            ? 'bg-white text-gray-900 shadow-sm font-semibold'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        EN
      </button>
    </div>
  );
};
