"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Smartphone, Sparkles } from "lucide-react";

export type Density = "auto" | "mobile" | "desktop";
const ORDER: Density[] = ["auto", "mobile", "desktop"];
const META: Record<Density, { Icon: typeof Monitor; label: string }> = {
  auto: { Icon: Sparkles, label: "Affichage auto" },
  mobile: { Icon: Smartphone, label: "Vue téléphone" },
  desktop: { Icon: Monitor, label: "Vue PC" },
};

export function nextDensity(d: Density): Density {
  return ORDER[(ORDER.indexOf(d) + 1) % ORDER.length];
}

export default function DensityButton({
  density,
  onChange,
}: {
  density: Density;
  onChange: (d: Density) => void;
}) {
  const { Icon, label } = META[density];
  return (
    <button
      onClick={() => onChange(nextDensity(density))}
      className="icon-btn relative"
      title={`${label} — toucher pour changer`}
      aria-label={label}
    >
      <Icon size={17} />
      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_6px_rgba(14,165,233,0.8)]" />
    </button>
  );
}

export function useDensity(): [Density, (d: Density) => void] {
  const [density, setDensity] = useState<Density>("auto");
  useEffect(() => {
    const saved = window.localStorage.getItem("gk-density");
    if (saved === "mobile" || saved === "desktop" || saved === "auto") setDensity(saved);
  }, []);
  const change = useCallback((d: Density) => {
    setDensity(d);
    window.localStorage.setItem("gk-density", d);
  }, []);
  return [density, change];
}
