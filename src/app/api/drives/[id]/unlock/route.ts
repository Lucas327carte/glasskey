import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getOwnedDrive } from "@/lib/tree";
import { DRIVE_CODE_RE } from "@/lib/util";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const body = (await req.json().catch(() => null)) as { code?: string } | null;
  const code = body?.code ?? "";
  if (!DRIVE_CODE_RE.test(code) || code !== drive.code) {
    return NextResponse.json({ error: "Code incorrect" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
