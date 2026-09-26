"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/util";

type Phase = "card" | "shrink" | "spin" | "draw" | "fade";

/**
 * Signature success animation:
 * 1. A frosted card appears (the "ghost" of the popup)
 * 2. It collapses into a thin glowing line
 * 3. The line spins a full turn
 * 4. The line dissolves and a checkmark is drawn in two strokes
 */
export default function SuccessOverlay({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<Phase>("card");
  const timedOut = useRef<number[]>([]);

  useEffect(() => {
    const t = (ms: number, fn: () => void) =>
      timedOut.current.push(window.setTimeout(fn, ms));
    t(170, () => setPhase("shrink"));
    t(600, () => setPhase("spin"));
    t(1150, () => setPhase("draw"));
    t(1830, () => setPhase("fade"));
    t(2140, () => onDone?.());
    return () => timedOut.current.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lineLike = phase === "shrink" || phase === "spin" || phase === "draw" || phase === "fade";

  return (
    <div
      className={cx(
        "pointer-events-none fixed inset-0 z-[140] flex items-center justify-center transition-opacity duration-300",
        phase === "fade" ? "opacity-0" : "opacity-100",
      )}
      aria-hidden
    >
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[7px]" />
      <div className="relative grid h-56 w-80 place-items-center">
        {/* morphing card -> line */}
        <div
          className={cx(
            "success-morph",
            lineLike ? "success-line" : "success-card",
            phase === "spin" && "success-spin",
            (phase === "draw" || phase === "fade") && "success-line-out",
          )}
        />
        {/* two-stroke checkmark */}
        {(phase === "draw" || phase === "fade") && (
          <svg viewBox="0 0 72 72" className="success-svg" fill="none">
            <defs>
              <linearGradient id="gkCheckGrad" x1="16" y1="52" x2="56" y2="20" gradientUnits="userSpaceOnUse">
                <stop stopColor="#0ea5e9" />
                <stop offset="1" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle cx="36" cy="36" r="31" className="success-ring" />
            <path d="M23 37.5 L31.5 46" pathLength={1} className="success-arm success-arm-1" />
            <path d="M31.5 46 L51 26" pathLength={1} className="success-arm success-arm-2" />
          </svg>
        )}
      </div>
    </div>
  );
}
