import { useAppStore } from '../store/appStore';
import { useDemoLogStore } from '../store/demoLogStore';
import { dispatchGuardianAlert } from './sos';
import { resetDeadmanEmailFlag } from '../services/emailAlertService';

export type DeadmanSource =
  | 'grocery'
  | 'attendance'
  | 'wellness'
  | 'longpress'
  | 'demobar';

let intervalTimer: ReturnType<typeof setInterval> | null = null;
let watcherInitialized = false;

export function isArmed(): boolean {
  const endsAt = useAppStore.getState().deadmanEndsAt;
  if (!endsAt) return false;
  return Date.now() < endsAt;
}

export function remaining(): number {
  const endsAt = useAppStore.getState().deadmanEndsAt;
  if (!endsAt) return 0;
  const rem = endsAt - Date.now();
  return rem > 0 ? rem : 0;
}

export function arm(source: DeadmanSource): void {
  const timerMode = useAppStore.getState().timerMode;
  // Durations: 15 min Real / 15 s Viva Demo
  const durationMs = timerMode === 'demo' ? 15 * 1000 : 15 * 60 * 1000;
  const endsAt = Date.now() + durationMs;

  useAppStore.getState().setDeadmanEndsAt(endsAt);
  resetDeadmanEmailFlag();

  useDemoLogStore
    .getState()
    .addLog(
      `Dead-man armed via ${source} (${timerMode === 'demo' ? '15s Demo' : '15m Real'})`,
      'timer'
    );
}

export function disarm(source: DeadmanSource): void {
  const wasArmed = isArmed();
  useAppStore.getState().setDeadmanEndsAt(null);

  if (wasArmed) {
    useDemoLogStore
      .getState()
      .addLog(`Dead-man disarmed via ${source}`, 'timer');
  }
}

export async function forceExpire(): Promise<void> {
  useAppStore.getState().setDeadmanEndsAt(null);
  useDemoLogStore
    .getState()
    .addLog('Dead-man timer forced expired by evaluator', 'timer');
  await dispatchGuardianAlert('deadman_expired');
}

async function checkDeadman(): Promise<void> {
  const endsAt = useAppStore.getState().deadmanEndsAt;
  if (!endsAt) return;

  if (Date.now() >= endsAt) {
    // Clear endsAt immediately so alert fires exactly once!
    useAppStore.getState().setDeadmanEndsAt(null);

    useDemoLogStore
      .getState()
      .addLog('Dead-man timer expired! Dispatching guardian alert...', 'timer');

    await dispatchGuardianAlert('deadman_expired');
  }
}

export function initDeadmanWatcher(): void {
  if (watcherInitialized || typeof window === 'undefined') return;
  watcherInitialized = true;

  // Check immediately on load/resume in case it expired while closed
  checkDeadman();

  // 1s interval check
  if (intervalTimer) clearInterval(intervalTimer);
  intervalTimer = setInterval(() => {
    checkDeadman();
  }, 1000);

  // Catch-up on visibilitychange and pageshow
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkDeadman();
    }
  });

  window.addEventListener('pageshow', () => {
    checkDeadman();
  });
}
