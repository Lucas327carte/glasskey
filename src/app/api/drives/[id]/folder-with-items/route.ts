import { NextRequest, NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { descendantIds, flatNodes, getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

/**
 * "Créer un dossier et mettre dedans": creates a folder in the current
 * location and moves the chosen items into it. It is always allowed to
 * save, even with zero items selected.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    parentId?: string | null;
    nodeIds?: string[];
  } | null;
  const name = cleanName(body?.name);
  const parentId = body?.parentId ?? null;
  const nodeIds = Array.isArray(body?.nodeIds) ? body!.nodeIds!.filter((x) => typeof x === "string") : [];
  if (!name) return NextResponse.json({ error: "Nom de dossier invalide" }, { status: 400 });

  if (parentId) {
    const parent = await db
      .select({ driveId: nodes.driveId, kind: nodes.kind })
      .from(nodes)
      .where(eq(nodes.id, parentId))
      .limit(1);
    if (!parent[0] || parent[0].driveId !== id || parent[0].kind !== "folder") {
      return NextResponse.json({ error: "Dossier parent introuvable" }, { status: 404 });
    }
  }

  const [folder] = await db
    .insert(nodes)
    .values({ driveId: id, parentId, kind: "folder", name })
    .returning({ id: nodes.id, name: nodes.name });

  let moved = 0;
  if (nodeIds.length) {
    const all = await flatNodes(id);
    const byId = new Map(all.map((n) => [n.id, n]));

    // Guard against cycles: moving an ancestor of the new folder into it
    // would create a loop, so those are skipped.
    const blocked = new Set<string>([folder.id]);
    let cur = parentId;
    let guard = 0;
    while (cur && guard++ < 64) {
      blocked.add(cur);
      cur = byId.get(cur)?.parentId ?? null;
    }
    for (const nid of nodeIds) {
      if (!byId.has(nid) || byId.get(nid)!.kind !== "folder") continue;
      for (const d of descendantIds(all, nid)) {
        if (d === folder.id) blocked.add(nid);
      }
    }

    const valid = nodeIds.filter((nid) => byId.has(nid) && !blocked.has(nid));
    if (valid.length) {
      const res = await db
        .update(nodes)
        .set({ parentId: folder.id })
        .where(and(eq(nodes.driveId, id), inArray(nodes.id, valid)))
        .returning({ id: nodes.id });
      moved = res.length;
    }
  }

  return NextResponse.json({ folder, moved });
}
