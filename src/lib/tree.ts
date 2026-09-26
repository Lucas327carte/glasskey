import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { drives, nodes } from "@/db/schema";

export async function getOwnedDrive(driveId: string, userId: string) {
  const rows = await db
    .select()
    .from(drives)
    .where(and(eq(drives.id, driveId), eq(drives.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export type FlatNode = { id: string; parentId: string | null; kind: string; name: string };

export async function flatNodes(driveId: string): Promise<FlatNode[]> {
  return db
    .select({ id: nodes.id, parentId: nodes.parentId, kind: nodes.kind, name: nodes.name })
    .from(nodes)
    .where(eq(nodes.driveId, driveId));
}

/** All node ids that are inside `nodeId` (itself excluded). */
export function descendantIds(all: FlatNode[], nodeId: string): Set<string> {
  const children = new Map<string | null, string[]>();
  for (const n of all) {
    const list = children.get(n.parentId) ?? [];
    list.push(n.id);
    children.set(n.parentId, list);
  }
  const out = new Set<string>();
  const queue = [...(children.get(nodeId) ?? [])];
  while (queue.length) {
    const cur = queue.pop()!;
    if (out.has(cur)) continue;
    out.add(cur);
    queue.push(...(children.get(cur) ?? []));
  }
  return out;
}

/** Chain from root to the given node (excluded), ordered top-down. */
export async function breadcrumb(nodeId: string | null) {
  const chain: { id: string; name: string }[] = [];
  let cur = nodeId;
  let guard = 0;
  while (cur && guard++ < 64) {
    const rows = await db
      .select({ id: nodes.id, name: nodes.name, parentId: nodes.parentId })
      .from(nodes)
      .where(eq(nodes.id, cur))
      .limit(1);
    const row = rows[0];
    if (!row) break;
    chain.unshift({ id: row.id, name: row.name });
    cur = row.parentId;
  }
  return chain;
}
