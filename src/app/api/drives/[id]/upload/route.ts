import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nodes } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 Mo par fichier
const MAX_FILES = 12;

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const parentRaw = form.get("parentId");
  const parentId = typeof parentRaw === "string" && parentRaw && parentRaw !== "root" ? parentRaw : null;

  if (parentId) {
    const parent = await db
      .select({ driveId: nodes.driveId, kind: nodes.kind })
      .from(nodes)
      .where(eq(nodes.id, parentId))
      .limit(1);
    if (!parent[0] || parent[0].driveId !== id || parent[0].kind !== "folder") {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (files.length > MAX_FILES) {
    return NextResponse.json({ error: `Maximum ${MAX_FILES} fichiers à la fois` }, { status: 400 });
  }
  const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) {
    return NextResponse.json(
      { error: `« ${tooBig.name} » dépasse la limite de 20 Mo` },
      { status: 400 },
    );
  }

  const created = [];
  for (const file of files) {
    const name = cleanName(file.name, 90) || `fichier-${Date.now()}`;
    const buf = Buffer.from(await file.arrayBuffer());
    const [row] = await db
      .insert(nodes)
      .values({
        driveId: id,
        parentId,
        kind: "file",
        name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        data: buf,
      })
      .returning({ id: nodes.id, name: nodes.name, size: nodes.size });
    created.push(row);
  }

  return NextResponse.json({ files: created });
}
