"use client";

import { useId } from "react";
import {
  Archive,
  Clapperboard,
  File,
  FileText,
  Image as ImageIcon,
  Music,
} from "lucide-react";
import { cx } from "@/lib/util";

type Category = "image" | "pdf" | "video" | "audio" | "archive" | "doc" | "other";

export function fileCategory(mimeType: string | null, name: string): Category {
  const mime = mimeType ?? "";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (/(zip|rar|7z|tar|gzip|x-7z|x-rar)/.test(mime) || ["zip", "rar", "7z", "tar", "gz"].includes(ext))
    return "archive";
  if (
    mime.startsWith("text/") ||
    /(word|excel|spreadsheet|presentation|officedocument)/.test(mime) ||
    ["txt", "md", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "csv", "odt"].includes(ext)
  )
    return "doc";
  return "other";
}

const chip: Record<Category, { grad: string; Icon: typeof File; ext?: string }> = {
  image: { grad: "from-fuchsia-400/90 to-purple-600/90", Icon: ImageIcon },
  pdf: { grad: "from-rose-400/90 to-red-600/90", Icon: FileText },
  video: { grad: "from-indigo-400/90 to-blue-600/90", Icon: Clapperboard },
  audio: { grad: "from-emerald-400/90 to-teal-600/90", Icon: Music },
  archive: { grad: "from-amber-300/90 to-orange-500/90", Icon: Archive },
  doc: { grad: "from-sky-400/90 to-cyan-600/90", Icon: FileText },
  other: { grad: "from-slate-400/90 to-slate-600/90", Icon: File },
};

function FolderGlyph({ className }: { className?: string }) {
  const id = useId().replace(/[:]/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id={`fb${id}`} x1="8" y1="14" x2="54" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7cc4ff" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={`ff${id}`} x1="6" y1="26" x2="58" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a5d8ff" />
          <stop offset="0.45" stopColor="#60b4fa" />
          <stop offset="1" stopColor="#2f7fe0" />
        </linearGradient>
      </defs>
      <path
        d="M6 18c0-3.3 2.7-6 6-6h11.5c2 0 3.9 1 5 2.7L31 18h21c3.3 0 6 2.7 6 6v2H6v-8Z"
        fill={`url(#fb${id})`}
      />
      <path
        d="M6 26h52c3.3 0 5.7 3.1 4.8 6.3l-3.4 13.4A8 8 0 0 1 51.7 53H12.3a8 8 0 0 1-7.9-6.6L2.8 32.3A5.2 5.2 0 0 1 6 26Z"
        fill={`url(#ff${id})`}
      />
      <path
        d="M6 26h52c3.3 0 5.7 3.1 4.8 6.3L62 35H8.5L4.6 28.6A5 5 0 0 1 6 26Z"
        fill="#ffffff"
        opacity="0.28"
      />
    </svg>
  );
}

export default function NodeIcon({
  kind,
  mimeType,
  name,
  size = "md",
}: {
  kind: "folder" | "file";
  mimeType: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "lg" ? "h-[4.5rem] w-[4.5rem]" : size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const iconSize = size === "lg" ? 30 : size === "sm" ? 18 : 23;

  if (kind === "folder") {
    return (
      <span className={cx("relative grid place-items-center", dims)}>
        <span className="absolute inset-1 rounded-[26%] bg-blue-500/40 blur-lg" aria-hidden />
        <FolderGlyph className="relative h-full w-full drop-shadow-[0_10px_18px_rgba(37,99,235,0.4)]" />
      </span>
    );
  }

  const cat = fileCategory(mimeType, name);
  const { grad, Icon } = chip[cat];

  return (
    <span
      className={cx(
        "relative grid place-items-center rounded-[26%] border border-slate-900/15 bg-gradient-to-br shadow-[0_12px_26px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.35)]",
        grad,
        dims,
      )}
    >
      <Icon size={iconSize} strokeWidth={2.1} className="text-white drop-shadow" />
    </span>
  );
}
