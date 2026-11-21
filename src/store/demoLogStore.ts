import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: string; // ISO or local time string
  message: string;
  type: 'info' | 'warn' | 'sos' | 'panic' | 'otp' | 'timer';
}

interface DemoLogState {
  logs: LogEntry[];
  addLog: (message: string, type?: LogEntry['type']) => void;
  clearLogs: () => void;
}

export const useDemoLogStore = create<DemoLogState>((set) => ({
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString(),
      message: 'Chuppi-Todo initialized in Phase 1 mode',
      type: 'info',
    },
  ],
  addLog: (message: string, type: LogEntry['type'] = 'info') => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type,
    };
    set((state) => ({
      logs: [newEntry, ...state.logs].slice(0, 100), // Keep last 100 entries
    }));
  },
  clearLogs: () => set({ logs: [] }),
}));
