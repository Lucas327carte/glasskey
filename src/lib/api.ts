"use client";

export async function api<T = unknown>(
  path: string,
  opts?: { method?: string; body?: unknown },
): Promise<T> {
  const res = await fetch(path, {
    method: opts?.method ?? (opts?.body !== undefined ? "POST" : "GET"),
    headers: opts?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: opts?.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "Erreur réseau");
  }
  return data as T;
}

export type DriveMeta = {
  id: string;
  name: string;
  hue: number;
  createdAt: string;
  itemCount: number;
  fileCount: number;
  usedBytes: number;
};

export type NodeMeta = {
  id: string;
  kind: "folder" | "file";
  name: string;
  mimeType: string | null;
  size: number | null;
  parentId: string | null;
  createdAt: string;
};

export type Crumb = { id: string | null; name: string };

export type FolderEntry = { id: string; parentId: string | null; name: string; label: string; depth: number };
