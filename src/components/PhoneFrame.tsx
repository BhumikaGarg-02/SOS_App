import React from 'react';

interface PhoneFrameProps {
  children: React.ReactNode;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-screen sm:min-h-0 sm:h-[min(860px,94vh)] sm:max-w-[420px] sm:rounded-[36px] bg-white shadow-2xl ring-1 ring-black/10 flex flex-col relative overflow-hidden transition-all duration-200">
      {/* Mobile Notch (desktop frame only, hidden on mobile <= 480px) */}
      <div className="hidden sm:flex absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/80 rounded-b-xl z-50 items-center justify-center">
        <div className="w-2.5 h-2.5 rounded-full bg-neutral-900 border border-neutral-700 mr-2" />
        <div className="w-8 h-1 rounded-full bg-neutral-800" />
      </div>

      {/* Screen contents */}
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};
