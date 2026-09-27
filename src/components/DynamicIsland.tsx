"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles, Star } from "lucide-react";
import { cx } from "@/lib/util";

export type IslandState = "idle" | "active" | "done" | "expanded";

export type IslandData = {
  state: IslandState;
  progress: number; // 0..100
  label: string;
  preview: string | null;
};

export type IslandController = {
  data: IslandData;
  setActive: (label: string, progress?: number) => void;
  setProgress: (p: number) => void;
  setDone: (preview?: string) => void;
  setIdle: () => void;
  expand: () => void;
  collapse: () => void;
  element: React.ReactNode;
};

export function useDynamicIsland(): IslandController {
  const [data, setData] = useState<IslandData>({
    state: "idle",
    progress: 0,
    label: "",
    preview: null,
  });
  const [closing, setClosing] = useState(false);

  const setActive = (label: string, progress = 0) =>
    setData({ state: "active", progress, label, preview: null });

  const setProgressVal = (p: number) =>
    setData((d) => ({ ...d, progress: p }));

  const setDone = (preview: string | null = null) =>
    setData((d) => ({ state: "done", progress: 100, label: "La tâche est terminée", preview }));

  const setIdle = () => {
    setClosing(true);
    setTimeout(() => {
      setData({ state: "idle", progress: 0, label: "", preview: null });
      setClosing(false);
    }, 500);
  };

  const expand = () => setData((d) => ({ ...d, state: "expanded" }));
  const collapse = () => setData((d) => ({ ...d, state: d.progress >= 100 ? "done" : "active" }));

  const element = <DynamicIslandInner data={data} closing={closing} onExpand={expand} onCollapse={collapse} onValidate={setIdle} />;

  return { data, setActive, setProgress: setProgressVal, setDone, setIdle, expand, collapse, element };
}

function DynamicIslandInner({
  data,
  closing,
  onExpand,
  onCollapse,
  onValidate,
}: {
  data: IslandData;
  closing: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onValidate: () => void;
}) {
  const { state, progress, label, preview } = data;
  const isExpanded = state === "expanded";
  const isActive = state === "active" || state === "done" || isExpanded;
  const showStars = state === "done" || (isExpanded && data.progress >= 100);

  const handleClick = () => {
    if (isExpanded) {
      onCollapse();
    } else {
      onExpand();
    }
  };

  const handleValidate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValidate();
  };

  const containerClass = cx(
    "island",
    closing && "bloop",
    isExpanded ? "island-expanded" : isActive ? "island-active" : "island-idle",
  );

  return (
    <div className={containerClass} onClick={handleClick}>
      <div className="island-aurora" aria-hidden />

      {/* idle: sober black bar */}
      {state === "idle" && (
        <div className="flex h-full items-center justify-center">
          <div className="h-1.5 w-10 rounded-full bg-white/15" />
        </div>
      )}

      {/* active: star + progress */}
      {(state === "active" || (isExpanded && progress < 100)) && (
        <div className="relative flex h-full items-center justify-center gap-2.5 px-4">
          <Star size={14} className="star-glow shrink-0 text-amber-300" fill="currentColor" />
          <span className="truncate text-[11px] font-medium text-white/80">
            {label || "Jarvis travaille…"}
          </span>
          {!isExpanded && (
            <div className="island-progress">
              <div className="island-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
          {isExpanded && (
            <Loader2 size={13} className="spin-slow shrink-0 text-white/60" />
          )}
        </div>
      )}

      {/* expanded active with progress bar below */}
      {isExpanded && progress < 100 && (
        <div className="px-5 pb-3 pt-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400 transition-all duration-400" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* done: stars + message + validate */}
      {(state === "done" || (isExpanded && progress >= 100)) && (
        <div className="flex h-full items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-2">
            <Star size={12} className="text-amber-300" fill="currentColor" />
            <Star size={14} className="text-violet-300" fill="currentColor" />
            <Star size={12} className="text-sky-300" fill="currentColor" />
          </div>
          {!isExpanded && (
            <span className="truncate text-[11px] font-medium text-white/85">
              {preview ?? label}
            </span>
          )}
          <button
            onClick={handleValidate}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
            aria-label="Valider"
          >
            <Check size={14} strokeWidth={3} />
          </button>
        </div>
      )}

      {/* expanded done: full preview */}
      {isExpanded && progress >= 100 && (
        <div className="px-5 pb-4 pt-1">
          <p className="text-xs font-medium text-white/70">{label}</p>
          {preview && (
            <p className="mt-1 text-sm text-white/90 line-clamp-3">{preview}</p>
          )}
          <button
            onClick={handleValidate}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white/15 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25"
          >
            <Check size={15} strokeWidth={2.5} />
            Valider
          </button>
        </div>
      )}

      {/* expanded idle (just shows star) */}
      {isExpanded && state === "expanded" && (
        <div className="flex h-full items-center justify-center gap-2 px-4">
          <Sparkles size={16} className="text-amber-300" />
          <span className="text-sm font-medium text-white/80">Jarvis</span>
        </div>
      )}
    </div>
  );
}

/** Convenience hook for components that just need to listen to island state via context. */
export function useIslandVisibility(data: IslandData) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (data.state !== "idle") setVisible(true);
    else {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [data.state]);
  return visible;
}
