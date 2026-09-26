import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, hashPin } from "@/lib/auth";
import { PIN_RE, USERNAME_RE } from "@/lib/util";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { username?: string; pin?: string } | null;
  const username = (body?.username ?? "").trim().toLowerCase();
  const pin = body?.pin ?? "";

  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Nom d'utilisateur invalide (3-24 caractères : lettres, chiffres, . _ -)" },
      { status: 400 },
    );
  }
  if (!PIN_RE.test(pin)) {
    return NextResponse.json(
      { error: "Le mot de passe doit contenir 4 à 6 chiffres" },
      { status: 400 },
    );
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username)).limit(1);
  if (existing.length) {
    return NextResponse.json({ error: "Ce nom d'utilisateur est déjà pris" }, { status: 409 });
  }

  const [user] = await db
    .insert(users)
    .values({ username, pinHash: hashPin(pin) })
    .returning({ id: users.id, username: users.username });
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username } });
}
