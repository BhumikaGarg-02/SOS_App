import { registerPanicCleanup } from './panic';

let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;
let activeOscillators: OscillatorNode[] = [];
let activeGainNodes: GainNode[] = [];
let activeTimeouts: ReturnType<typeof setTimeout>[] = [];
let isRinging = false;

/**
 * Ensures AudioContext is created and resumed synchronously on user interaction.
 * Must be called directly inside onClick handlers to unlock browser audio autoplay.
 */
export function ensureAudioUnlocked(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Plays one dual-tone telephone burst:
 * 440Hz (sine) + 480Hz (triangle) at gain 0.28 for durationSec (1.2s).
 */
function playDualToneRing(durationSec = 1.2) {
  const ctx = ensureAudioUnlocked();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    // 440Hz + 480Hz sine/triangle oscillators
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(480, now);

    // Gain 0.28 with smooth ramp to avoid clicks
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.28, now + 0.03);
    gainNode.gain.setValueAtTime(0.28, now + durationSec - 0.03);
    gainNode.gain.linearRampToValueAtTime(0.0001, now + durationSec);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + durationSec);
    osc2.stop(now + durationSec);

    activeOscillators.push(osc1, osc2);
    activeGainNodes.push(gainNode);

    const cleanupTimer = setTimeout(() => {
      activeOscillators = activeOscillators.filter((o) => o !== osc1 && o !== osc2);
      activeGainNodes = activeGainNodes.filter((g) => g !== gainNode);
      try {
        osc1.disconnect();
        osc2.disconnect();
        gainNode.disconnect();
      } catch {}
    }, (durationSec + 0.1) * 1000);

    activeTimeouts.push(cleanupTimer);
  } catch (e) {
    console.error('Audio tone error', e);
  }
}

/**
 * Start dual-tone phone ringtone (440Hz + 480Hz, gain 0.28):
 * Ringing for 1.2s, pausing for 1.5s in a continuous loop (2.7s cycle).
 */
export function startRingtone(): void {
  if (isRinging) return;
  isRinging = true;

  const ctx = ensureAudioUnlocked();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const playCycle = () => {
    if (!isRinging) return;

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    playDualToneRing(1.2);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([1200, 1500]);
      } catch {}
    }
  };

  playCycle();
  ringInterval = setInterval(playCycle, 2700); // 1.2s ring + 1.5s pause
}

/**
 * Stop ringtone oscillators and vibration cleanly.
 */
export function stopRingtone(): void {
  isRinging = false;
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  for (const t of activeTimeouts) {
    clearTimeout(t);
  }
  activeTimeouts = [];

  for (const osc of activeOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  }
  activeOscillators = [];

  for (const g of activeGainNodes) {
    try {
      g.disconnect();
    } catch {}
  }
  activeGainNodes = [];

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(0);
    } catch {}
  }
}

// Automatically stop ringtone on any panic-flip lock
registerPanicCleanup(() => {
  stopRingtone();
});
