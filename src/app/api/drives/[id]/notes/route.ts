import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

const MAX_CONTENT = 300_000; // ~300 Ko de texte

function withTxtExt(name: string): string {
  return /\.[a-z0-9]{1,5}$/i.test(name) ? name : `${name}.txt`;
}

/** Create a plain-text document inside a drive (optionally in a folder). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    parentId?: string | null;
    content?: string;
  } | null;

  const rawName = cleanName(body?.name, 80) || "Sans titre";
  const name = withTxtExt(rawName);
  const parentId = body?.parentId ?? null;
  const content = typeof body?.content === "string" ? body.content : "";
  if (content.length > MAX_CONTENT) {
    return NextResponse.json({ error: "Document trop long (300 Ko max)" }, { status: 400 });
  }

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
    .values({
      driveId: id,
      parentId,
      kind: "file",
      name,
      mimeType: "text/plain",
      size: Buffer.byteLength(content, "utf8"),
      data: Buffer.from(content, "utf8"),
    })
    .returning({ id: nodes.id, name: nodes.name, size: nodes.size });

  return NextResponse.json({ node });
}
