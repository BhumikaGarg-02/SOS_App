import { getSetting } from './db';
import { verifyPin, deriveVaultKey } from './crypto';
import { useDemoLogStore } from '../store/demoLogStore';
import { useAppStore } from '../store/appStore';

let wrongAttempts: number[] = [];
let cooldownUntil = 0;
let cooldownTimer: ReturnType<typeof setTimeout> | null = null;

export function getLimiterStatus(): {
  isCoolingDown: boolean;
  attemptsCount: number;
  remainingCooldownMs: number;
} {
  const now = Date.now();
  // Filter attempts older than 60s
  wrongAttempts = wrongAttempts.filter((t) => now - t < 60000);
  const isCoolingDown = now < cooldownUntil;
  return {
    isCoolingDown,
    attemptsCount: wrongAttempts.length,
    remainingCooldownMs: isCoolingDown ? cooldownUntil - now : 0,
  };
}

export async function check(pin: string): Promise<'REAL' | 'DECOY' | 'NONE' | 'IGNORED'> {
  // Only digits-only entries of exactly 4 characters are ever counted
  if (!/^\d{4}$/.test(pin)) {
    return 'NONE';
  }

  const now = Date.now();

  // If in cooldown period
  if (now < cooldownUntil) {
    return 'IGNORED';
  }

  // Filter attempts within the last 60 seconds
  wrongAttempts = wrongAttempts.filter((t) => now - t < 60000);

  const realHash = await getSetting<string>('realPinHash');
  const realSalt = await getSetting<string>('realPinSalt');
  const decoyHash = await getSetting<string>('decoyPinHash');
  const decoySalt = await getSetting<string>('decoyPinSalt');

  // Verify REAL PIN
  if (realHash && realSalt) {
    const isReal = await verifyPin(pin, realHash, realSalt);
    if (isReal) {
      wrongAttempts = [];
      cooldownUntil = 0;
      useAppStore.getState().setLimiterState('READY');
      await deriveVaultKey(pin);
      return 'REAL';
    }
  }

  // Verify DECOY PIN
  if (decoyHash && decoySalt) {
    const isDecoy = await verifyPin(pin, decoyHash, decoySalt);
    if (isDecoy) {
      wrongAttempts = [];
      cooldownUntil = 0;
      useAppStore.getState().setLimiterState('READY');
      return 'DECOY';
    }
  }

  // Wrong attempt
  wrongAttempts.push(now);

  if (wrongAttempts.length >= 5) {
    cooldownUntil = now + 30000; // 30s cooldown
    useAppStore.getState().setLimiterState('COOLDOWN');
    useDemoLogStore
      .getState()
      .addLog('PIN limiter triggered: 5 wrong attempts. Silently ignoring PIN checks for 30s', 'warn');

    if (cooldownTimer) {
      clearTimeout(cooldownTimer);
    }
    cooldownTimer = setTimeout(() => {
      useAppStore.getState().setLimiterState('READY');
      useDemoLogStore
        .getState()
        .addLog('PIN limiter cooldown period ended. State: READY', 'info');
      cooldownUntil = 0;
      wrongAttempts = [];
    }, 30000);
  }

  return 'NONE';
}
