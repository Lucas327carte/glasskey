import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  return <HomeClient username={user.username} />;
}
