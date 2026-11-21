import { useRef, useCallback } from 'react';

export interface LongPressOptions {
  thresholdMs?: number;
  moveTolerancePx?: number;
}

export function useLongPress(
  onLongPress: () => void,
  { thresholdMs = 3000, moveTolerancePx = 10 }: LongPressOptions = {}
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent) => {
      // Primary pointer only (left mouse or primary finger)
      if (e.button !== 0 && e.pointerType === 'mouse') return;

      firedRef.current = false;
      startPosRef.current = { x: e.clientX, y: e.clientY };

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, thresholdMs);
    },
    [onLongPress, thresholdMs]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current || !timerRef.current) return;

      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);

      if (dx > moveTolerancePx || dy > moveTolerancePx) {
        // Canceled on movement
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    },
    [moveTolerancePx]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  return {
    onPointerDown: start,
    onPointerMove: move,
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
  };
}
