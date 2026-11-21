import React, { useRef } from 'react';
import { StealthDot } from './StealthDot';
import { LangToggle } from './LangToggle';
import { useLongPress } from '../lib/longPress';
import { isArmed, arm, disarm } from '../lib/deadman';

interface CoverShellProps {
  title: string;
  bgColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  onDoubleTapHotZone?: () => void;
  onDoubleTap?: () => void;
  children: React.ReactNode;
}

export const CoverShell: React.FC<CoverShellProps> = ({
  title,
  bgColor = '#FFFFFF',
  headerBgColor = 'transparent',
  headerTextColor = '#1B2440',
  onDoubleTapHotZone,
  onDoubleTap,
  children,
}) => {
  const lastTapRef = useRef<number>(0);

  // 3-second long press toggles dead-man timer
  const handleToggleTimer = () => {
    if (isArmed()) {
      disarm('longpress');
    } else {
      arm('longpress');
    }
  };

  const longPressHandlers = useLongPress(handleToggleTimer, { thresholdMs: 3000 });

  // 56x56 invisible hot zone with 400ms double-tap
  const handleHotZoneClick = () => {
    const now = Date.now();
    if (now - lastTapRef.current <= 400) {
      if (onDoubleTapHotZone) {
        onDoubleTapHotZone();
      }
      if (onDoubleTap) {
        onDoubleTap();
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  return (
    <div
      className="relative flex flex-col h-full w-full select-none overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      {/* Cover Header */}
      <header
        className="flex items-center justify-between px-4 py-3 shrink-0 relative border-b border-black/5"
        style={{ backgroundColor: headerBgColor, color: headerTextColor }}
      >
        {/* StealthDot (6px, top-left) */}
        <div className="flex items-center gap-2">
          <StealthDot />
        </div>

        {/* Title with 3-second pointer long press */}
        <h1
          {...longPressHandlers}
          className="font-heading font-semibold text-lg tracking-tight cursor-default select-none text-center px-2 flex-1"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          {title}
        </h1>

        {/* Language Toggle */}
        <div className="flex items-center">
          <LangToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto relative">{children}</main>

      {/* Invisible 56x56 bottom-right hot zone (Phase 3 fake call hook) */}
      <div
        aria-hidden="true"
        onClick={handleHotZoneClick}
        className="absolute bottom-0 right-0 w-[56px] h-[56px] z-30 cursor-default opacity-0"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
};
