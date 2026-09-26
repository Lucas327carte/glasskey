import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { breadcrumb, getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const parentParam = req.nextUrl.searchParams.get("parent");
  const parentId = parentParam && parentParam !== "root" ? parentParam : null;

  if (parentId) {
    const parent = await db
      .select({ id: nodes.id, driveId: nodes.driveId, kind: nodes.kind })
      .from(nodes)
      .where(eq(nodes.id, parentId))
      .limit(1);
    if (!parent[0] || parent[0].driveId !== id || parent[0].kind !== "folder") {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }
  }

  const list = await db
    .select({
      id: nodes.id,
      kind: nodes.kind,
      name: nodes.name,
      mimeType: nodes.mimeType,
      size: nodes.size,
      parentId: nodes.parentId,
      createdAt: nodes.createdAt,
    })
    .from(nodes)
    .where(and(eq(nodes.driveId, id), parentId ? eq(nodes.parentId, parentId) : isNull(nodes.parentId)))
    .orderBy(sql`CASE WHEN ${nodes.kind} = 'folder' THEN 0 ELSE 1 END`, asc(sql`lower(${nodes.name})`));

  const crumbs = await breadcrumb(parentId);
  return NextResponse.json({
    drive: { id: drive.id, name: drive.name, hue: drive.hue },
    parentId,
    path: [{ id: null as string | null, name: drive.name }, ...crumbs],
    nodes: list,
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    parentId?: string | null;
  } | null;
  const name = cleanName(body?.name);
  const parentId = body?.parentId ?? null;
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

  const [node] = await db
    .insert(nodes)
    .values({ driveId: id, parentId, kind: "folder", name })
    .returning({ id: nodes.id, name: nodes.name });
  return NextResponse.json({ node });
}
