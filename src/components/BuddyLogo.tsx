import React from 'react';

interface BuddyLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
}

export const BuddyLogo: React.FC<BuddyLogoProps> = ({
  size = 'md',
  showWordmark = false,
  className = '',
}) => {
  const badgeDimensions = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-16 h-16 rounded-2xl',
    xl: 'w-20 h-20 rounded-3xl',
  }[size];

  const textSize = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Friendly teal badge with white smiling face */}
      <div
        className={`${badgeDimensions} bg-[#2F6F73] text-white flex items-center justify-center shrink-0 shadow-sm select-none`}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          className="w-3/5 h-3/5"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="23" cy="26" r="4" fill="#FFFFFF" />
          <circle cx="41" cy="26" r="4" fill="#FFFFFF" />
          <path
            d="M 21 37 Q 32 49 43 37"
            stroke="#FFFFFF"
            strokeWidth="4.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>

      {showWordmark && (
        <span className={`font-heading font-bold text-[#2F6F73] tracking-tight ${textSize}`}>
          Buddy
        </span>
      )}
    </div>
  );
};
