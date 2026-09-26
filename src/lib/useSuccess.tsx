"use client";

import { useCallback, useState } from "react";
import SuccessOverlay from "@/components/SuccessOverlay";

/** Fire-and-forget wrapper around the SuccessOverlay animation. */
export function useSuccessFlash() {
  const [job, setJob] = useState<{ id: number; done?: () => void } | null>(null);

  const fire = useCallback((done?: () => void) => {
    setJob({ id: Date.now() + Math.random(), done });
  }, []);

  const element = job ? (
    <SuccessOverlay
      key={job.id}
      onDone={() => {
        const d = job.done;
        setJob(null);
        d?.();
      }}
    />
  ) : null;

  return { fire, element, active: job !== null };
}
