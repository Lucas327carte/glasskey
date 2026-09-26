import type { ReactNode } from "react";

/** Aurora background + global SVG defs (the #frosted filter used by glass elements). */
export default function GlassBackdrop({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="aurora" aria-hidden>
        <i />
        <i />
        <i />
      </div>
      <div className="noise" aria-hidden />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id="frosted" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
            <feColorMatrix type="saturate" values="1.6" />
          </filter>
        </defs>
      </svg>
      {children}
    </>
  );
}
