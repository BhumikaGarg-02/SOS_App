import { registerPanicCleanup } from './panic';

let audioCtx: AudioContext | null = null;
let ringInterval: ReturnType<typeof setInterval> | null = null;
let activeOscillators: OscillatorNode[] = [];
let isRinging = false;

/**
 * Ensures AudioContext is created and resumed on user interaction.
 * Should be invoked on the first user tap/click anywhere in the app.
 */
export function ensureAudioUnlocked(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
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

function playToneBurst(durationSec = 0.4) {
  if (!audioCtx || audioCtx.state !== 'running') return;
  try {
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, audioCtx.currentTime);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(480, audioCtx.currentTime);

    // Smooth gain ramp to avoid clicks
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.15, audioCtx.currentTime + 0.04);
    gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime + durationSec - 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationSec);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + durationSec);
    osc2.stop(audioCtx.currentTime + durationSec);

    activeOscillators.push(osc1, osc2);
    setTimeout(() => {
      activeOscillators = activeOscillators.filter((o) => o !== osc1 && o !== osc2);
    }, (durationSec + 0.1) * 1000);
  } catch (e) {
    console.error('Audio tone error', e);
  }
}

/**
 * Start two-tone telephone ring pattern:
 * 0.4s tone, 0.2s pause, 0.4s tone, 2.0s pause.
 * Falls back to vibration or visual ring if audio is suspended.
 */
export function startRingtone(): void {
  if (isRinging) return;
  isRinging = true;

  const ctx = ensureAudioUnlocked();
  const canAudio = ctx && ctx.state === 'running';

  const playPattern = () => {
    if (!isRinging) return;

    if (canAudio) {
      playToneBurst(0.4);
      setTimeout(() => {
        if (isRinging) playToneBurst(0.4);
      }, 600);
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400]);
      } catch {}
    }
  };

  playPattern();
  ringInterval = setInterval(playPattern, 3000);
}

/**
 * Stop ringtone oscillators and vibration.
 */
export function stopRingtone(): void {
  isRinging = false;
  if (ringInterval) {
    clearInterval(ringInterval);
    ringInterval = null;
  }
  for (const osc of activeOscillators) {
    try {
      osc.stop();
      osc.disconnect();
    } catch {}
  }
  activeOscillators = [];
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
