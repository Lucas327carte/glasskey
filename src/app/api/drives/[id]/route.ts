import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { drives } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { getOwnedDrive } from "@/lib/tree";
import { cleanName } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { name?: string } | null;
  const name = cleanName(body?.name, 32);
  if (!name) return NextResponse.json({ error: "Nom invalide" }, { status: 400 });

  await db.update(drives).set({ name }).where(eq(drives.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  await db.delete(drives).where(eq(drives.id, id));
  return NextResponse.json({ ok: true });
}
