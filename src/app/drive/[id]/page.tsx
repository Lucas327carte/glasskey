import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getOwnedDrive } from "@/lib/tree";
import ExplorerClient from "./explorer-client";

export const dynamic = "force-dynamic";

export default async function DrivePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  const { id } = await params;
  const drive = await getOwnedDrive(id, user.id);
  if (!drive) redirect("/drives");
  return <ExplorerClient drive={{ id: drive.id, name: drive.name, hue: drive.hue }} />;
}
