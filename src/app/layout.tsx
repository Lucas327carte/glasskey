import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "GlassKey — Clés USB virtuelles",
  description:
    "Crée des clés USB virtuelles sécurisées par code, organise dossiers et fichiers, et retrouve-les sur tous tes appareils.",
  applicationName: "GlassKey",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "GlassKey" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#eef1f8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
