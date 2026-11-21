import { useAppStore } from '../store/appStore';
import { useDemoLogStore } from '../store/demoLogStore';
import { useDemoFlagsStore } from '../store/demoFlagsStore';
import { clearSessionKey } from './crypto';

// Permission Guard
let permissionPromptInProgress = false;
let permissionTimeout: ReturnType<typeof setTimeout> | null = null;

export const permissionGuard = {
  begin() {
    permissionPromptInProgress = true;
    if (permissionTimeout) clearTimeout(permissionTimeout);
    // 5-second cap
    permissionTimeout = setTimeout(() => {
      permissionPromptInProgress = false;
    }, 5000);
  },
  end() {
    permissionPromptInProgress = false;
    if (permissionTimeout) {
      clearTimeout(permissionTimeout);
      permissionTimeout = null;
    }
  },
  isPrompting() {
    return permissionPromptInProgress;
  },
};

// Registered cleanup callbacks (e.g. for cover inputs, audio URLs)
const cleanupCallbacks: Array<() => void> = [];

export function registerPanicCleanup(cb: () => void): () => void {
  cleanupCallbacks.push(cb);
  return () => {
    const idx = cleanupCallbacks.indexOf(cb);
    if (idx !== -1) cleanupCallbacks.splice(idx, 1);
  };
}

export function lockNow(reason: string = 'manual'): number {
  const t0 = performance.now();

  // Instant CSS hide rule body.locked * { visibility: hidden }
  document.body.classList.add('locked');

  // Direct synchronous store update
  const store = useAppStore.getState();
  if (store.screen !== 'cover' && store.screen !== 'onboarding') {
    useAppStore.setState({ screen: 'cover', unlocked: false });
  } else {
    useAppStore.setState({ unlocked: false });
  }

  // Drop AES key & clear decrypted caches
  clearSessionKey();

  // Run cleanup callbacks (revoke URLs, clear cover inputs, etc.)
  for (const cb of cleanupCallbacks) {
    try {
      cb();
    } catch (e) {
      console.error('Error during panic cleanup:', e);
    }
  }

  const latency = performance.now() - t0;

  // Remove the locked class on next tick so the cover renders cleanly
  requestAnimationFrame(() => {
    document.body.classList.remove('locked');
  });

  useDemoLogStore
    .getState()
    .addLog(`Panic-flip locked (${reason}) in ${latency.toFixed(2)}ms`, 'panic');

  return latency;
}

let listenersInitialized = false;

export function initPanicListeners(): void {
  if (listenersInitialized || typeof window === 'undefined') return;
  listenersInitialized = true;

  // 1. visibilitychange
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const screen = useAppStore.getState().screen;
      if (screen === 'vault' || screen === 'fakeVault') {
        const autoLockDisabled = useDemoFlagsStore.getState().autoLockDisabled;
        if (autoLockDisabled) {
          useDemoLogStore
            .getState()
            .addLog('auto-lock suppressed: visibilitychange (hidden)', 'warn');
        } else {
          lockNow('visibilitychange');
        }
      }
    }
  });

  // 2. pagehide
  window.addEventListener('pagehide', () => {
    const screen = useAppStore.getState().screen;
    if (screen === 'vault' || screen === 'fakeVault') {
      const autoLockDisabled = useDemoFlagsStore.getState().autoLockDisabled;
      if (autoLockDisabled) {
        useDemoLogStore.getState().addLog('auto-lock suppressed: pagehide', 'warn');
      } else {
        lockNow('pagehide');
      }
    }
  });

  // 3. blur
  window.addEventListener('blur', () => {
    if (permissionGuard.isPrompting()) {
      // Permission guard: while true, ignore blur only, never visibilitychange
      return;
    }
    const screen = useAppStore.getState().screen;
    if (screen === 'vault' || screen === 'fakeVault') {
      const autoLockDisabled = useDemoFlagsStore.getState().autoLockDisabled;
      if (autoLockDisabled) {
        useDemoLogStore.getState().addLog('auto-lock suppressed: window.blur', 'warn');
      } else {
        lockNow('blur');
      }
    }
  });
}
