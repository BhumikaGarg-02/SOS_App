import { create } from 'zustand';
import { useDemoLogStore } from './demoLogStore';
import { startRingtone, stopRingtone } from '../lib/ringtone';

export type ScreenType =
  | 'onboarding'
  | 'cover'
  | 'vault'
  | 'fakeVault'
  | 'incomingCall'
  | 'activeCall'
  | 'casePacket';

export type CoverType = 'grocery' | 'cgpa' | 'wellness';
export type TimerMode = 'real' | 'demo';
export type LangType = 'en' | 'hi';

export interface GroceryItem {
  id: string;
  tag: string;
  amount: number;
}

interface AppState {
  screen: ScreenType;
  unlocked: boolean;
  lang: LangType;
  cover: CoverType;
  setupComplete: boolean;
  timerMode: TimerMode;
  fakeCallerName: string;
  deadmanEndsAt: number | null;
  groceryBill: GroceryItem[];
  limiterState: 'READY' | 'COOLDOWN';
  returnTo: ScreenType;
  fakeCallPending: boolean;
  fakeCallEndsAt: number | null;

  setScreen: (screen: ScreenType) => void;
  setUnlocked: (unlocked: boolean) => void;
  setLang: (lang: LangType) => void;
  setCover: (cover: CoverType) => void;
  setSetupComplete: (complete: boolean) => void;
  setTimerMode: (mode: TimerMode) => void;
  setFakeCallerName: (name: string) => void;
  setDeadmanEndsAt: (endsAt: number | null) => void;
  setGroceryBill: (bill: GroceryItem[]) => void;
  addGroceryItem: (tag: string, amount: number) => void;
  clearGroceryBill: () => void;
  setLimiterState: (state: 'READY' | 'COOLDOWN') => void;
  setReturnTo: (screen: ScreenType) => void;
  startFakeCall: (delayMs?: number) => void;
  cancelFakeCall: () => void;
}

// Initial state from localStorage (non-sensitive only)
const storedSetup = localStorage.getItem('chuppi_setupComplete') === 'true';
const storedLang = (localStorage.getItem('chuppi_lang') as LangType) || 'en';
const storedCover = (localStorage.getItem('chuppi_cover') as CoverType) || 'grocery';
const storedTimerMode = (localStorage.getItem('chuppi_timerMode') as TimerMode) || 'demo';
const storedFakeCaller = localStorage.getItem('chuppi_fakeCallerName') || 'Maa';
const storedEndsAtRaw = localStorage.getItem('chuppi_deadman_endsAt');
const storedEndsAt = storedEndsAtRaw ? Number(storedEndsAtRaw) : null;

let storedBill: GroceryItem[] = [];
try {
  const billRaw = localStorage.getItem('chuppi_grocery_bill');
  if (billRaw) {
    storedBill = JSON.parse(billRaw);
  }
} catch {
  storedBill = [];
}

// Always cold-starts on cover if setup is complete, never on vault!
const initialScreen: ScreenType = storedSetup ? 'cover' : 'onboarding';

let fakeCallTimer: ReturnType<typeof setTimeout> | null = null;

function triggerIncomingCall() {
  useAppStore.setState({
    screen: 'incomingCall',
    fakeCallPending: false,
    fakeCallEndsAt: null,
  });
  startRingtone();
  useDemoLogStore.getState().addLog('Fake call incoming: ringing started', 'info');
}

// Visibility change listener to trigger call if fired while document was hidden
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const state = useAppStore.getState();
      if (
        state.fakeCallPending &&
        state.fakeCallEndsAt &&
        Date.now() >= state.fakeCallEndsAt &&
        state.screen !== 'incomingCall' &&
        state.screen !== 'activeCall'
      ) {
        triggerIncomingCall();
      }
    }
  });
}

export const useAppStore = create<AppState>((set) => ({
  screen: initialScreen,
  unlocked: false,
  lang: storedLang,
  cover: storedCover,
  setupComplete: storedSetup,
  timerMode: storedTimerMode,
  fakeCallerName: storedFakeCaller,
  deadmanEndsAt: storedEndsAt,
  groceryBill: storedBill,
  limiterState: 'READY',
  returnTo: 'cover',
  fakeCallPending: false,
  fakeCallEndsAt: null,

  setScreen: (screen) => set({ screen }),
  setUnlocked: (unlocked) => set({ unlocked }),
  setLang: (lang) => {
    localStorage.setItem('chuppi_lang', lang);
    document.documentElement.lang = lang;
    set({ lang });
  },
  setCover: (cover) => {
    localStorage.setItem('chuppi_cover', cover);
    set({ cover });
  },
  setSetupComplete: (setupComplete) => {
    localStorage.setItem('chuppi_setupComplete', String(setupComplete));
    set({ setupComplete });
  },
  setTimerMode: (timerMode) => {
    localStorage.setItem('chuppi_timerMode', timerMode);
    set({ timerMode });
  },
  setFakeCallerName: (fakeCallerName) => {
    localStorage.setItem('chuppi_fakeCallerName', fakeCallerName);
    set({ fakeCallerName });
  },
  setDeadmanEndsAt: (deadmanEndsAt) => {
    if (deadmanEndsAt === null) {
      localStorage.removeItem('chuppi_deadman_endsAt');
    } else {
      localStorage.setItem('chuppi_deadman_endsAt', String(deadmanEndsAt));
    }
    set({ deadmanEndsAt });
  },
  setGroceryBill: (groceryBill) => {
    localStorage.setItem('chuppi_grocery_bill', JSON.stringify(groceryBill));
    set({ groceryBill });
  },
  addGroceryItem: (tag, amount) => {
    set((state) => {
      const updated = [
        ...state.groceryBill,
        { id: Math.random().toString(36).substring(2, 9), tag, amount },
      ];
      localStorage.setItem('chuppi_grocery_bill', JSON.stringify(updated));
      return { groceryBill: updated };
    });
  },
  clearGroceryBill: () => {
    localStorage.removeItem('chuppi_grocery_bill');
    set({ groceryBill: [] });
  },
  setLimiterState: (limiterState) => set({ limiterState }),
  setReturnTo: (returnTo) => set({ returnTo }),

  startFakeCall: (delayMs = 5000) => {
    if (fakeCallTimer) {
      clearTimeout(fakeCallTimer);
      fakeCallTimer = null;
    }
    useDemoLogStore
      .getState()
      .addLog(
        delayMs <= 0
          ? 'Fake call started immediately'
          : `Fake call scheduled in ${(delayMs / 1000).toFixed(1)}s`,
        'info'
      );

    if (delayMs <= 0) {
      set({ returnTo: 'cover' });
      triggerIncomingCall();
      return;
    }

    const endsAt = Date.now() + delayMs;
    set({
      fakeCallPending: true,
      fakeCallEndsAt: endsAt,
      returnTo: 'cover',
    });

    fakeCallTimer = setTimeout(() => {
      fakeCallTimer = null;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        useDemoLogStore
          .getState()
          .addLog('Fake call ready, holding until app is visible', 'info');
        return;
      }
      triggerIncomingCall();
    }, delayMs);
  },

  cancelFakeCall: () => {
    if (fakeCallTimer) {
      clearTimeout(fakeCallTimer);
      fakeCallTimer = null;
    }
    stopRingtone();
    set({ fakeCallPending: false, fakeCallEndsAt: null });
    useDemoLogStore.getState().addLog('Fake call cancelled', 'info');
  },
}));
