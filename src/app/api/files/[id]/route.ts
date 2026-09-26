import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

const MAX_CONTENT = 300_000;

/** Update a text document's name and/or content. */
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;

  const rows = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);
  const node = rows[0];
  if (!node || node.kind !== "file") {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
  const drive = await getOwnedDrive(node.driveId, user.id);
  if (!drive) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    content?: string;
  } | null;

  const patch: { name?: string; data?: Buffer; size?: number } = {};
  if (body?.name !== undefined) {
    const name = cleanName(body.name, 80);
    if (!name) return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
    patch.name = name;
  }
  if (body?.content !== undefined) {
    if (typeof body.content !== "string" || body.content.length > MAX_CONTENT) {
      return NextResponse.json({ error: "Contenu invalide ou trop long" }, { status: 400 });
    }
    patch.data = Buffer.from(body.content, "utf8");
    patch.size = Buffer.byteLength(body.content, "utf8");
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });
  }

  await db.update(nodes).set(patch).where(eq(nodes.id, id));
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;

  const rows = await db.select().from(nodes).where(eq(nodes.id, id)).limit(1);
  const node = rows[0];
  if (!node || node.kind !== "file" || !node.data) {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
  const drive = await getOwnedDrive(node.driveId, user.id);
  if (!drive) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

  const download = req.nextUrl.searchParams.get("download") === "1";
  const mime = node.mimeType || "application/octet-stream";
  const encoded = encodeURIComponent(node.name).replace(/'/g, "%27");
  const disposition = `${download ? "attachment" : "inline"}; filename*=UTF-8''${encoded}`;

  return new NextResponse(new Uint8Array(node.data), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(node.data.length),
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
