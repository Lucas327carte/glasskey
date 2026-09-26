import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import DrivesClient from "./drives-client";

export const dynamic = "force-dynamic";

export default async function DrivesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  return <DrivesClient username={user.username} />;
}
