import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import AuthClient from "./auth-client";

export const dynamic = "force-dynamic";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/drives");
  const { mode } = await searchParams;
  return <AuthClient initialMode={mode === "signup" ? "signup" : "login"} />;
}
