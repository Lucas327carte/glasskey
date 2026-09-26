"use client";

import { useCallback, useRef } from "react";

export type Pt = { x: number; y: number };

/**
 * Long-press (touch) + right-click (desktop) handler factory.
 * Returns bindable handlers and a guard to swallow the synthetic click
 * that follows a long-press.
 */
export function useLongPress(onLongPress: (pt: Pt) => void, delay = 460) {
  const timer = useRef<number | null>(null);
  const start = useRef<Pt | null>(null);
  const fired = useRef(false);

  const clear = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      clear();
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      const pt = start.current;
      timer.current = window.setTimeout(() => {
        fired.current = true;
        onLongPress(pt);
      }, delay);
    },
    [clear, delay, onLongPress],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!start.current) return;
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      if (dx * dx + dy * dy > 12 * 12) {
        clear();
        start.current = null;
      }
    },
    [clear],
  );

  const onPointerUp = useCallback(() => {
    clear();
    start.current = null;
  }, [clear]);

  const onContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      clear();
      fired.current = true;
      onLongPress({ x: e.clientX, y: e.clientY });
    },
    [clear, onLongPress],
  );

  /** Returns true once if the click event should be ignored. */
  const shouldIgnoreClick = useCallback(() => {
    if (fired.current) {
      fired.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    bind: { onPointerDown, onPointerMove, onPointerUp, onPointerLeave: onPointerUp, onContextMenu },
    shouldIgnoreClick,
  };
}
