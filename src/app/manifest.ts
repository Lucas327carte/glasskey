import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GlassKey — Clés USB virtuelles",
    short_name: "GlassKey",
    description:
      "Crée des clés USB virtuelles protégées par code, organise dossiers et fichiers, et retrouve-les sur tous tes appareils.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#eef1f8",
    theme_color: "#eef1f8",
    lang: "fr",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
