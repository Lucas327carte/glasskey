"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  Camera,
  CheckSquare,
  FolderTree,
  LogOut,
  Mic,
  NotebookPen,
  Settings,
  Sparkles,
  Star,
  Usb,
} from "lucide-react";
import GlassBackdrop from "@/components/GlassBackdrop";
import JarvisChat from "@/components/JarvisChat";
import Sidebar, { Conversation } from "@/components/Sidebar";
import { firstName } from "@/lib/util";

type ModuleDef = {
  id: string;
  label: string;
  desc: string;
  icon: typeof Usb;
  gradient: string;
  glow: string;
  action: () => void;
};

export default function HomeClient({ username }: { username: string }) {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const openDrives = () => router.push("/drives");
  const openJarvis = () => setChatOpen(true);
  const openSettings = () => setSettingsOpen(true);
  const openLibrary = () => router.push("/drives");

  const modules: ModuleDef[] = [
    {
      id: "usb",
      label: "Clé USB virtuelle",
      desc: "Stockage & fichiers",
      icon: Usb,
      gradient: "from-sky-400 to-blue-600",
      glow: "rgba(56, 189, 248, 0.35)",
      action: openDrives,
    },
    {
      id: "notes",
      label: "Notes rapides",
      desc: "Prise de notes",
      icon: NotebookPen,
      gradient: "from-amber-400 to-orange-500",
      glow: "rgba(251, 191, 36, 0.3)",
      action: () => router.push("/drives"),
    },
    {
      id: "projects",
      label: "Projets & Matières",
      desc: "Dossiers hiérarchiques",
      icon: FolderTree,
      gradient: "from-emerald-400 to-teal-600",
      glow: "rgba(16, 185, 129, 0.3)",
      action: openDrives,
    },
    {
      id: "tasks",
      label: "Tâches & Listes",
      desc: "Devoirs & horaires",
      icon: CheckSquare,
      gradient: "from-rose-400 to-pink-600",
      glow: "rgba(244, 63, 94, 0.3)",
      action: () => router.push("/drives"),
    },
    {
      id: "ocr",
      label: "Numérisation / OCR",
      desc: "Photo → texte IA",
      icon: Camera,
      gradient: "from-violet-400 to-purple-600",
      glow: "rgba(139, 92, 246, 0.3)",
      action: () => router.push("/drives"),
    },
    {
      id: "jarvis",
      label: "Jarvis AI",
      desc: "Discussion avec l'IA",
      icon: Star,
      gradient: "from-amber-400 to-violet-500",
      glow: "rgba(168, 85, 247, 0.35)",
      action: openJarvis,
    },
  ];

  const handleNewChat = useCallback(() => {
    setChatOpen(true);
  }, []);

  const handleSelectChat = useCallback((id: string) => {
    setChatOpen(true);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handlePinChat = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const handleRenameChat = useCallback((id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c)),
    );
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/auth");
  };

  return (
    <>
      <GlassBackdrop>
        <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
          {/* header */}
          <header className="rise mb-8 flex items-center gap-3">
            <div className="glass grid h-12 w-12 shrink-0 place-items-center rounded-[18px]">
              <Sparkles size={22} className="text-amber-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-slate-500">Bonjour {firstName(username)},</p>
              <h1 className="truncate text-2xl font-bold tracking-tight">Bienvenue sur GlassKey</h1>
            </div>
            <button onClick={openSettings} className="icon-btn" aria-label="Paramètres" title="Paramètres">
              <Settings size={17} />
            </button>
            <button onClick={logout} className="icon-btn" aria-label="Se déconnecter" title="Se déconnecter">
              <LogOut size={17} />
            </button>
          </header>

          {/* module grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5">
            {modules.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <button
                  key={mod.id}
                  onClick={mod.action}
                  className="module-tile rise group relative flex flex-col items-center gap-4 p-1 text-center"
                  style={{ ["--d" as string]: `${i * 0.06}s` }}
                  aria-label={mod.label}
                >
                  <div
                    className="tile-box glass relative grid aspect-square w-full place-items-center rounded-[30px]"
                    style={{ boxShadow: `0 12px 30px ${mod.glow}` }}
                  >
                    <div
                      className="absolute -inset-8 opacity-40 blur-2xl transition-opacity group-hover:opacity-60"
                      style={{ background: `radial-gradient(circle, ${mod.glow}, transparent 65%)` }}
                      aria-hidden
                    />
                    <div
                      className={`relative grid h-16 w-16 place-items-center rounded-[22px] bg-gradient-to-br ${mod.gradient} shadow-lg transition-transform group-hover:scale-110`}
                    >
                      <Icon size={28} className="text-white drop-shadow" />
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-sm font-semibold leading-tight">{mod.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{mod.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* quick hint */}
          <div className="rise mt-10 flex items-center justify-center gap-2 text-center text-xs text-slate-400" style={{ ["--d" as string]: "0.4s" }}>
            <Mic size={13} />
            <span>Touche l'icône étoile pour parler à Jarvis</span>
          </div>
        </main>
      </GlassBackdrop>

      {/* sidebar */}
      <Sidebar
        username={username}
        conversations={conversations}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onPinChat={handlePinChat}
        onRenameChat={handleRenameChat}
        activeChatId={null}
        onOpenSettings={openSettings}
        onOpenLibrary={openLibrary}
      />

      {/* Jarvis chat overlay */}
      {chatOpen && (
        <JarvisChat
          onMinimize={() => setChatOpen(false)}
          username={username}
        />
      )}

      {/* settings modal */}
      {settingsOpen && (
        <SettingsModal username={username} onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}

function SettingsModal({ username, onClose }: { username: string; onClose: () => void }) {
  const [geminiKey, setGeminiKey] = useState("");
  const [mediaKey, setMediaKey] = useState("");
  const [temperament, setTemperament] = useState("helpful");
  const [customPrompt, setCustomPrompt] = useState("");
  const [theme, setTheme] = useState("blue");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("jarvis_settings");
    if (raw) {
      try {
        const s = JSON.parse(raw);
        setGeminiKey(s.geminiKey || "");
        setMediaKey(s.mediaKey || "");
        setTemperament(s.temperament || "helpful");
        setCustomPrompt(s.customPrompt || "");
        setTheme(s.theme || "blue");
      } catch {
        // ignore
      }
    }
  }, []);

  const save = () => {
    localStorage.setItem(
      "jarvis_settings",
      JSON.stringify({ geminiKey, mediaKey, temperament, customPrompt, theme }),
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const temperaments = [
    { id: "helpful", label: "Serviable" },
    { id: "concise", label: "Concis" },
    { id: "creative", label: "Créatif" },
    { id: "custom", label: "Personnalisé" },
  ];

  const themes = [
    { id: "blue", label: "Bleu", color: "#3b82f6" },
    { id: "pink", label: "Rose", color: "#ec4899" },
    { id: "yellow", label: "Jaune", color: "#eab308" },
    { id: "green", label: "Vert", color: "#10b981" },
  ];

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-strong sheet-in mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[32px] p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold">Paramètres</h2>
          <button onClick={onClose} className="icon-btn h-9 w-9" aria-label="Fermer">
            <Settings size={16} />
          </button>
        </div>

        {/* Profile */}
        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Profil</h3>
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-lg font-bold text-white shadow-md">
              {firstName(username).charAt(0)}
            </div>
            <input className="field flex-1" defaultValue={username} placeholder="Ton nom" />
          </div>
        </section>

        {/* Theme */}
        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Thème</h3>
          <div className="flex gap-2.5">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  theme === t.id
                    ? "border-slate-900/20 bg-slate-900/[0.08]"
                    : "border-slate-900/10 bg-slate-900/[0.03] hover:bg-slate-900/[0.06]"
                }`}
              >
                <span className="h-4 w-4 rounded-full" style={{ background: t.color }} />
                {t.label}
              </button>
            ))}
          </div>
        </section>

        {/* Jarvis temperament */}
        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Tempérament de Jarvis</h3>
          <div className="grid grid-cols-2 gap-2">
            {temperaments.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemperament(t.id)}
                className={`rounded-2xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  temperament === t.id
                    ? "border-sky-500/50 bg-sky-500/15 text-slate-900"
                    : "border-slate-900/10 bg-slate-900/[0.04] text-slate-600 hover:bg-slate-900/[0.06]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {temperament === "custom" && (
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ton prompt personnalisé pour Jarvis…"
              rows={3}
              className="field mt-3 resize-none"
            />
          )}
        </section>

        {/* API keys */}
        <section className="mb-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Clés API</h3>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Gemini API</label>
          <input
            type="password"
            className="field mb-3"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="Clé API Gemini"
          />
          <label className="mb-1.5 block text-xs font-medium text-slate-500">Génération média</label>
          <input
            type="password"
            className="field"
            value={mediaKey}
            onChange={(e) => setMediaKey(e.target.value)}
            placeholder="Clé API média (optionnel)"
          />
          <p className="mt-2 text-xs text-slate-400">
            Les clés sont stockées localement sur ton appareil.
          </p>
        </section>

        <button onClick={save} className="btn btn-primary w-full">
          {saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
