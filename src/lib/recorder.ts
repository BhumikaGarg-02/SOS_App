import { permissionGuard, registerPanicCleanup } from './panic';

// --- Active stream registry so lockNow can stop them ---
const activeStreams: Set<MediaStream> = new Set();

function registerStream(stream: MediaStream): void {
  activeStreams.add(stream);
}

function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((t) => t.stop());
  activeStreams.delete(stream);
}

// Register global cleanup so lockNow stops all active streams
registerPanicCleanup(() => {
  for (const stream of activeStreams) {
    stream.getTracks().forEach((t) => t.stop());
  }
  activeStreams.clear();
});

// Supported audio MIME types in preference order
const AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/webm',
];

function getSupportedAudioMime(): string {
  for (const mime of AUDIO_MIME_TYPES) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return 'audio/webm';
}

export interface AudioRecorderControls {
  stop: () => void;
  getLevel: () => number; // 0–1 current RMS level
  getElapsedMs: () => number;
}

export interface AudioResult {
  blob: Blob;
  mime: string;
  durationMs: number;
}

/**
 * Start audio recording. Returns controls and a promise that resolves when stopped.
 * Throws if permission denied.
 */
export async function startAudioRecording(): Promise<{
  controls: AudioRecorderControls;
  result: Promise<AudioResult>;
}> {
  permissionGuard.begin();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    permissionGuard.end();
  } catch (err) {
    permissionGuard.end();
    throw err;
  }

  registerStream(stream);

  // AnalyserNode for level meter
  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  source.connect(analyser);
  const dataArr = new Uint8Array(analyser.frequencyBinCount);

  const getLevel = (): number => {
    analyser.getByteTimeDomainData(dataArr);
    let sum = 0;
    for (const v of dataArr) {
      const norm = (v - 128) / 128;
      sum += norm * norm;
    }
    return Math.sqrt(sum / dataArr.length);
  };

  const mime = getSupportedAudioMime();
  const recorder = new MediaRecorder(stream, { mimeType: mime });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const startTime = Date.now();

  const result = new Promise<AudioResult>((resolve) => {
    recorder.onstop = () => {
      stopStream(stream);
      ctx.close();
      const blob = new Blob(chunks, { type: mime });
      resolve({ blob, mime, durationMs: Date.now() - startTime });
    };
  });

  recorder.start(100); // collect in 100ms chunks

  const controls: AudioRecorderControls = {
    stop: () => {
      if (recorder.state !== 'inactive') recorder.stop();
    },
    getLevel,
    getElapsedMs: () => Date.now() - startTime,
  };

  return { controls, result };
}

/**
 * Capture a photo from the environment-facing camera.
 * Returns a JPEG Blob. Throws if permission denied.
 */
export async function capturePhoto(): Promise<{ blob: Blob; mime: string }> {
  permissionGuard.begin();
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    });
    permissionGuard.end();
  } catch (err) {
    permissionGuard.end();
    throw err;
  }

  registerStream(stream);

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.setAttribute('playsinline', 'true');
    video.muted = true;

    video.onloadedmetadata = () => {
      video.play().then(() => {
        // Give camera a moment to adjust exposure
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx2d = canvas.getContext('2d');
          if (!ctx2d) {
            stopStream(stream);
            reject(new Error('Canvas context unavailable'));
            return;
          }
          ctx2d.drawImage(video, 0, 0);
          stopStream(stream);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('toBlob failed'));
                return;
              }
              resolve({ blob, mime: 'image/jpeg' });
            },
            'image/jpeg',
            0.85
          );
        }, 300);
      });
    };

    video.onerror = () => {
      stopStream(stream);
      reject(new Error('Video load error'));
    };
  });
}
