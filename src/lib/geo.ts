import { permissionGuard } from './panic';
import { useDemoFlagsStore } from '../store/demoFlagsStore';

export type GpsMode = 'real' | 'denied' | 'fallback';

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy?: number;
  locationSource: 'gps' | 'fallback';
}

// Cache the last known good position
let lastCachedFix: LocationResult | null = null;

export function getLastCachedFix(): LocationResult | null {
  return lastCachedFix;
}

export function getFallbackLocation(): LocationResult {
  const fb = useDemoFlagsStore.getState().fallbackGps ?? { lat: 28.6139, lng: 77.209 };
  return { lat: fb.lat, lng: fb.lng, locationSource: 'fallback' };
}

export interface GetLocationOptions {
  timeoutMs?: number;
  mode?: GpsMode;
}

export async function getLocation(opts: GetLocationOptions = {}): Promise<LocationResult> {
  const { timeoutMs = 5000 } = opts;
  const flags = useDemoFlagsStore.getState();
  const gpsMode: GpsMode = flags.gpsMode ?? 'real';
  const fallback = getFallbackLocation();

  // Honor Demo Bar GPS mode overrides
  if (gpsMode === 'denied' || gpsMode === 'fallback') {
    return fallback;
  }

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return lastCachedFix ?? fallback;
  }

  return new Promise<LocationResult>((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        permissionGuard.end();
        resolve(lastCachedFix ?? fallback);
      }
    }, timeoutMs);

    permissionGuard.begin();

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          permissionGuard.end();
          const fix: LocationResult = {
            lat: Number(pos.coords.latitude.toFixed(5)),
            lng: Number(pos.coords.longitude.toFixed(5)),
            accuracy: pos.coords.accuracy,
            locationSource: 'gps',
          };
          lastCachedFix = fix;
          resolve(fix);
        }
      },
      (_err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          permissionGuard.end();
          resolve(lastCachedFix ?? fallback);
        }
      },
      { timeout: timeoutMs, enableHighAccuracy: false, maximumAge: 60000 }
    );
  });
}
