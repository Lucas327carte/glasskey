export const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

export const USERNAME_RE = /^[a-z0-9._-]{3,24}$/;
export const PIN_RE = /^\d{4,6}$/;
export const DRIVE_CODE_RE = /^\d{2,4}$/;

export function cleanName(v: unknown, max = 60): string {
  if (typeof v !== "string") return "";
  return v.replace(/[\\/]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}

export function fmtSize(bytes: number | null | undefined): string {
  const b = Number(bytes ?? 0);
  if (!Number.isFinite(b) || b <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go", "To"];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n >= 100 ? Math.round(n) : n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
}

export function firstName(username: string): string {
  const head = username.split(/[._-]/)[0] || username;
  return head.charAt(0).toUpperCase() + head.slice(1);
}
