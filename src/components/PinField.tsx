"use client";

import { forwardRef } from "react";
import { cx } from "@/lib/util";

/** iOS-like numeric code input (bullets or visible digits). */
const PinField = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (v: string) => void;
    maxLength: number;
    secret?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
    shakeKey?: number;
    onSubmit?: () => void;
  }
>(function PinField(
  { value, onChange, maxLength, secret = true, autoFocus, placeholder, shakeKey = 0, onSubmit },
  ref,
) {
  return (
    <input
      key={shakeKey}
      ref={ref}
      type={secret ? "password" : "tel"}
      inputMode="numeric"
      autoComplete="off"
      autoFocus={autoFocus}
      maxLength={maxLength}
      value={value}
      placeholder={placeholder ?? "•".repeat(Math.min(maxLength, 4))}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, maxLength))}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSubmit?.();
      }}
      className={cx("pin-field", shakeKey > 0 && "shake")}
      aria-label="Code"
    />
  );
});

export default PinField;
