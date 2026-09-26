import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { descendantIds, flatNodes, getOwnedDrive } from "@/lib/tree";

type Ctx = { params: Promise<{ id: string }> };

/** Flat folder tree with human labels, used by the "move" picker. */
export async function GET(req: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { id } = await ctx.params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });

  const all = await flatNodes(id);
  const exclude = req.nextUrl.searchParams.get("exclude");
  const banned = new Set<string>();
  if (exclude) {
    banned.add(exclude);
    for (const d of descendantIds(all, exclude)) banned.add(d);
  }

  const byId = new Map(all.map((n) => [n.id, n]));
  const folders = all.filter((n) => n.kind === "folder" && !banned.has(n.id));

  const buildPath = (fid: string): string[] => {
    const parts: string[] = [];
    let cur = byId.get(fid);
    let guard = 0;
    while (cur && guard++ < 64) {
      parts.unshift(cur.name);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return parts;
  };

  const depth = (fid: string): number => {
    let d = 0;
    let cur = byId.get(fid);
    let guard = 0;
    while (cur?.parentId && guard++ < 64) {
      d++;
      cur = byId.get(cur.parentId);
    }
    return d;
  };

  const entries = folders
    .map((f) => ({ id: f.id, parentId: f.parentId, name: f.name, label: buildPath(f.id).join(" / "), depth: depth(f.id) }))
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return NextResponse.json({ folders: entries });
}
