import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPin } from "@/lib/auth";
import { PIN_RE, USERNAME_RE } from "@/lib/util";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { username?: string; pin?: string } | null;
  const username = (body?.username ?? "").trim().toLowerCase();
  const pin = body?.pin ?? "";

  if (!USERNAME_RE.test(username) || !PIN_RE.test(pin)) {
    return NextResponse.json(
      { error: "Vérifie ton nom d'utilisateur et ton code (4 à 6 chiffres)" },
      { status: 401 },
    );
  }

  const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
  const user = rows[0];
  if (!user) {
    return NextResponse.json(
      { error: "Aucun compte trouvé pour ce nom — inscris-toi d'abord (c'est rapide)" },
      { status: 401 },
    );
  }
  if (!verifyPin(pin, user.pinHash)) {
    return NextResponse.json(
      { error: "Code incorrect — réessaie avec tes 4 à 6 chiffres" },
      { status: 401 },
    );
  }

  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
