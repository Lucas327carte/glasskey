"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/util";

export type MenuItem = {
  icon: LucideIcon;
  label: string;
  destructive?: boolean;
  onClick: () => void;
};

export type MenuState = { x: number; y: number; title: string; items: MenuItem[] } | null;

/** iOS-style floating context menu that appears at the press point. */
export default function ContextMenu({
  menu,
  onClose,
}: {
  menu: MenuState;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; ox: string; oy: string } | null>(null);

  useLayoutEffect(() => {
    if (!menu) {
      setPos(null);
      return;
    }
    const el = ref.current;
    const w = el?.offsetWidth ?? 260;
    const h = el?.offsetHeight ?? 300;
    const pad = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.max(pad, Math.min(menu.x - w / 2, vw - w - pad));
    const below = menu.y + 14 + h > vh - pad;
    const top = below ? Math.max(pad, menu.y - h - 14) : menu.y + 14;
    setPos({
      left,
      top,
      ox: `${Math.max(10, Math.min(90, ((menu.x - left) / w) * 100))}%`,
      oy: below ? "100%" : "0%",
    });
  }, [menu]);

  if (!menu) return null;

  return (
    <div className="fixed inset-0 z-[100]" onPointerDown={onClose} onContextMenu={(e) => e.preventDefault()}>
      <div
        ref={ref}
        onPointerDown={(e) => e.stopPropagation()}
        className="menu-in glass-strong absolute w-[248px] overflow-hidden rounded-[22px] p-1.5"
        style={{
          left: pos?.left ?? menu.x,
          top: pos?.top ?? menu.y,
          transformOrigin: `${pos?.ox ?? "50%"} ${pos?.oy ?? "0%"}`,
          visibility: pos ? "visible" : "hidden",
        }}
      >
        <p className="truncate px-3.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          {menu.title}
        </p>
        {menu.items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              onClose();
              item.onClick();
            }}
            className={cx(
              "flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left text-[15px] font-medium transition-colors",
              item.destructive
                ? "text-rose-600 hover:bg-red-500/10"
                : "text-slate-800 hover:bg-slate-900/[0.06]",
            )}
          >
            <item.icon size={18} strokeWidth={2.2} className="shrink-0 opacity-85" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
