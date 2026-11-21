import React from 'react';
import { useAppStore } from '../store/appStore';

export const StealthDot: React.FC = () => {
  const deadmanEndsAt = useAppStore((state) => state.deadmanEndsAt);
  const isArmed = deadmanEndsAt !== null && Date.now() < deadmanEndsAt;

  return (
    <div
      aria-hidden="true"
      title="Status indicator"
      className="w-[6px] h-[6px] rounded-full transition-colors duration-300"
      style={{
        backgroundColor: isArmed ? '#9AA0A6' : '#C9CDD2',
      }}
    />
  );
};
