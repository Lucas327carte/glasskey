import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { descendantIds, flatNodes, getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

async function getOwnedNode(nodeId: string, userId: string) {
  const rows = await db.select().from(nodes).where(eq(nodes.id, nodeId)).limit(1);
  const node = rows[0];
  if (!node) return null;
  const drive = await getOwnedDrive(node.driveId, userId);
  if (!drive) return null;
  return node;
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const node = await getOwnedNode(id, user.id);
  if (!node) return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    parentId?: string | null;
  } | null;

  const patch: { name?: string; parentId?: string | null } = {};

  if (body?.name !== undefined) {
    const name = cleanName(body.name);
    if (!name) return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    patch.name = name;
  }

  if (body && "parentId" in body) {
    const target = body.parentId ?? null;
    if (target === id) {
      return NextResponse.json({ error: "Déplacement impossible" }, { status: 400 });
    }
    if (target) {
      const dest = await db
        .select({ driveId: nodes.driveId, kind: nodes.kind })
        .from(nodes)
        .where(eq(nodes.id, target))
        .limit(1);
      if (!dest[0] || dest[0].driveId !== node.driveId || dest[0].kind !== "folder") {
        return NextResponse.json({ error: "Destination invalide" }, { status: 400 });
      }
      if (node.kind === "folder") {
        const all = await flatNodes(node.driveId);
        if (descendantIds(all, id).has(target)) {
          return NextResponse.json(
            { error: "Impossible de déplacer un dossier dans lui-même" },
            { status: 400 },
          );
        }
      }
    }
    patch.parentId = target;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
  }

  await db.update(nodes).set(patch).where(eq(nodes.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const node = await getOwnedNode(id, user.id);
  if (!node) return NextResponse.json({ error: "Élément introuvable" }, { status: 404 });

  await db.delete(nodes).where(eq(nodes.id, id));
  return NextResponse.json({ ok: true });
}
