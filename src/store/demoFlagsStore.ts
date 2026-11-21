import { create } from 'zustand';
import type { GpsMode } from '../lib/geo';

interface DemoFlagsState {
  autoLockDisabled: boolean;
  setAutoLockDisabled: (disabled: boolean) => void;
  lastOtpHint: string;
  setLastOtpHint: (otp: string) => void;
  fallbackGps: { lat: number; lng: number };
  setFallbackGps: (gps: { lat: number; lng: number }) => void;
  gpsMode: GpsMode;
  setGpsMode: (mode: GpsMode) => void;
}

export const useDemoFlagsStore = create<DemoFlagsState>((set) => ({
  autoLockDisabled: false,
  setAutoLockDisabled: (disabled: boolean) => set({ autoLockDisabled: disabled }),
  lastOtpHint: '1234',
  setLastOtpHint: (otp: string) => set({ lastOtpHint: otp }),
  fallbackGps: { lat: 28.6139, lng: 77.209 }, // New Delhi default
  setFallbackGps: (gps) => set({ fallbackGps: gps }),
  gpsMode: 'real',
  setGpsMode: (mode: GpsMode) => set({ gpsMode: mode }),
}));
