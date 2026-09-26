"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/util";

/** Centered iOS-style glass popup. */
export default function Sheet({
  open,
  onClose,
  title,
  icon,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="fade-in absolute inset-0 cursor-default bg-slate-900/30 backdrop-blur-[10px]"
      />
      <div
        role="dialog"
        aria-modal
        className={cx(
          "sheet-in glass-strong relative w-full rounded-[28px] p-5 sm:p-6",
          wide ? "max-w-lg" : "max-w-sm",
        )}
      >
        {(title || icon) && (
          <div className="mb-4 flex items-center gap-3">
            {icon && (
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-900/10 bg-slate-900/[0.06]">
                {icon}
              </span>
            )}
            <h2 className="text-balance flex-1 text-lg font-semibold tracking-tight">{title}</h2>
            <button onClick={onClose} className="icon-btn h-9! w-9!" aria-label="Fermer">
              <X size={17} strokeWidth={2.4} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
