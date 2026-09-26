import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { drives } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { cleanName, DRIVE_CODE_RE } from "@/lib/util";

const HUES = [215, 262, 190, 322, 20, 152, 285, 45];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const rows = await db
    .select({
      id: drives.id,
      name: drives.name,
      hue: drives.hue,
      createdAt: drives.createdAt,
      itemCount:
        sql<number>`(SELECT count(*)::int FROM nodes WHERE nodes.drive_id = "drives"."id")`.mapWith(Number),
      fileCount:
        sql<number>`(SELECT count(*)::int FROM nodes WHERE nodes.drive_id = "drives"."id" AND nodes.kind = 'file')`.mapWith(Number),
      usedBytes:
        sql<number>`(SELECT COALESCE(SUM(size), 0)::bigint FROM nodes WHERE nodes.drive_id = "drives"."id" AND nodes.kind = 'file')`.mapWith(Number),
    })
    .from(drives)
    .where(eq(drives.userId, user.id))
    .orderBy(asc(drives.createdAt));

  return NextResponse.json({ drives: rows });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { name?: string; code?: string } | null;
  const name = cleanName(body?.name, 32);
  const code = body?.code ?? "";

  if (!name) return NextResponse.json({ error: "Donne un nom à ta clé" }, { status: 400 });
  if (!DRIVE_CODE_RE.test(code)) {
    return NextResponse.json({ error: "Le code doit contenir 2 à 4 chiffres" }, { status: 400 });
  }

  const dup = await db
    .select({ id: drives.id })
    .from(drives)
    .where(and(eq(drives.userId, user.id), eq(drives.code, code)))
    .limit(1);
  if (dup.length) {
    return NextResponse.json(
      { error: "Ce code est déjà utilisé par une autre de tes clés" },
      { status: 409 },
    );
  }

  const count = await db
    .select({ n: sql<number>`count(*)::int`.mapWith(Number) })
    .from(drives)
    .where(eq(drives.userId, user.id));

  const [drive] = await db
    .insert(drives)
    .values({ userId: user.id, name, code, hue: HUES[(count[0]?.n ?? 0) % HUES.length] })
    .returning({ id: drives.id, name: drives.name, hue: drives.hue });

  return NextResponse.json({ drive });
}
