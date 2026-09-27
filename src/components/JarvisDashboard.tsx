"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell, BookOpen, Check, FileText, FolderKanban, Image as ImageIcon,
  Library, Mic, MoreHorizontal, Plus, Search, Send, Settings, Sparkles,
  Square, StickyNote, Usb, X,
} from "lucide-react";

const modules = [
  { label: "Clé virtuelle", meta: "3 espaces sécurisés", icon: Usb, tone: "from-sky-400 to-blue-600" },
  { label: "Notes rapides", meta: "2 brouillons récents", icon: StickyNote, tone: "from-amber-300 to-orange-500" },
  { label: "Projets & matières", meta: "Français · 8 documents", icon: FolderKanban, tone: "from-violet-400 to-indigo-600" },
  { label: "Scanner OCR", meta: "Importer un document", icon: ImageIcon, tone: "from-emerald-300 to-teal-600" },
];

const chats = ["Révisions de français", "Organisation de la semaine", "Idées de projet"];

export default function JarvisDashboard() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [islandOpen, setIslandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [name, setName] = useState("Lucas");
  const [tasks, setTasks] = useState([
    { title: "Relire le chapitre 4", time: "Aujourd'hui · 17:30", done: false },
    { title: "Devoir de mathématiques", time: "Demain · 18:00", done: false },
  ]);

  useEffect(() => {
    const saved = window.localStorage.getItem("glasskey-profile");
    if (saved) {
      try { setName(JSON.parse(saved).name || "Lucas"); } catch { /* ignore malformed local profile */ }
    }
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 18 ? "Bon après-midi" : "Bonsoir";
  }, []);

  const send = () => {
    if (!message.trim()) return;
    setSent(true);
    setIslandOpen(true);
    setMessage("");
    window.setTimeout(() => setSent(false), 2600);
  };

  return (
    <div className="relative flex min-h-dvh w-full gap-4 p-3 sm:p-5">
      <aside className={`${sidebarOpen ? "w-[264px]" : "w-[58px]"} glass glass-strong hidden shrink-0 flex-col rounded-[28px] p-3 transition-[width] duration-500 lg:flex`}>
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          <button onClick={() => setSidebarOpen((open) => !open)} className="flex items-center gap-2 font-bold" aria-label="Ouvrir ou fermer Jarvis">
            <span className="grid size-9 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 text-white shadow-lg"><Sparkles size={18} /></span>
            {sidebarOpen && <span className="text-lg">Jarvis</span>}
          </button>
          {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="icon-btn size-8" aria-label="Fermer la barre latérale"><X size={15} /></button>}
        </div>
        <nav className="mt-7 flex flex-col gap-1" aria-label="Navigation Jarvis">
          {[{ icon: Plus, label: "Nouvelle discussion" }, { icon: Search, label: "Rechercher" }, { icon: Library, label: "Bibliothèque" }].map(({ icon: Icon, label }) => <button key={label} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-white/70"><Icon size={17} />{sidebarOpen && label}</button>)}
        </nav>
        {sidebarOpen && <><p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Récentes</p><div className="mt-2 flex flex-col gap-1">{chats.map((chat) => <button key={chat} className="truncate rounded-2xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-white/65">{chat}</button>)}</div></>}
        <div className="mt-auto flex items-center gap-2 border-t border-slate-900/10 px-2 pt-3"><div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-sm font-bold text-white">{name[0]}</div>{sidebarOpen && <><span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span><button className="icon-btn size-8" onClick={() => setOnboarding(true)} aria-label="Paramètres"><Settings size={15} /></button></>}</div>
      </aside>

      <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-col pb-5">
        <header className="flex items-center justify-between gap-4 px-1 py-2 sm:px-3"><div><p className="text-sm font-medium text-slate-500">{greeting},</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bonjour {name}</h1></div><div className="flex items-center gap-2"><button className="icon-btn" aria-label="Notifications"><Bell size={18} /></button><button onClick={() => setOnboarding(true)} className="icon-btn lg:hidden" aria-label="Paramètres"><Settings size={18} /></button><button onClick={() => setIslandOpen((open) => !open)} className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-blue-500/20" aria-label="Ouvrir Jarvis"><Sparkles size={20} /></button></div></header>

        <section className="rise mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]" style={{ ["--d" as string]: "0.16s" }}>
          <div className="flex min-w-0 flex-col gap-5">
            <div className="glass glass-hairline overflow-hidden rounded-[30px] p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-500"><Sparkles size={14} /> Jarvis</p><h2 className="text-xl font-bold tracking-tight">Que veux-tu faire aujourd'hui ?</h2></div><button className="icon-btn" aria-label="Plus d'options"><MoreHorizontal size={18} /></button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{modules.map(({ label, meta, icon: Icon, tone }) => <button key={label} className="group rounded-[22px] border border-slate-900/[0.08] bg-white/35 p-3 text-left transition hover:-translate-y-1 hover:bg-white/70"><span className={`mb-3 grid size-10 place-items-center rounded-[14px] bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon size={19} /></span><span className="block text-sm font-semibold leading-tight">{label}</span><span className="mt-1 block text-[11px] leading-snug text-slate-500">{meta}</span></button>)}</div><div className="mt-5 flex items-end gap-2 rounded-[23px] border border-slate-900/[0.08] bg-white/60 p-2 pl-4 shadow-inner">{!listening && <button className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-slate-900/[0.06] text-slate-500" aria-label="Ajouter une pièce jointe"><Plus size={18} /></button>}{listening ? <div className="flex h-9 flex-1 items-center justify-center gap-1.5" aria-label="Enregistrement en cours">{Array.from({ length: 18 }, (_, index) => <i key={index} className="voice-bar" style={{ ["--i" as string]: index }} />)}</div> : <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); send(); } }} rows={1} placeholder="Écris à Jarvis…" className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" />}{listening && <button onClick={() => setListening(false)} className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-slate-900/10 text-slate-700" aria-label="Arrêter la dictée"><Square size={15} /></button>}<button onClick={() => setListening((value) => !value)} className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-900/[0.06]" aria-label="Dictée vocale"><Mic size={17} /></button><button onClick={send} disabled={!message.trim()} className={`mb-0.5 grid size-9 shrink-0 place-items-center rounded-full transition ${message.trim() ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-slate-900/[0.08] text-slate-400"}`} aria-label="Envoyer"><Send size={16} /></button></div>{sent && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600"><Check size={14} /> Message envoyé à Jarvis</p>}</div>
            <div className="glass glass-hairline rounded-[30px] p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">À ne pas oublier</p><h2 className="mt-1 text-lg font-bold">Tes prochaines tâches</h2></div><button className="icon-btn" aria-label="Ajouter une tâche"><Plus size={17} /></button></div><div className="flex flex-col gap-2">{tasks.map((task, index) => <button key={task.title} onClick={() => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} className="flex items-center gap-3 rounded-[18px] bg-white/40 px-3 py-3 text-left transition hover:bg-white/70"><span className={`grid size-6 shrink-0 place-items-center rounded-full border ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-900/15"}`}>{task.done && <Check size={14} />}</span><span className="min-w-0 flex-1"><span className={`block truncate text-sm font-medium ${task.done ? "text-slate-400 line-through" : ""}`}>{task.title}</span><span className="mt-0.5 block text-xs text-slate-400">{task.time}</span></span></button>)}</div></div>
          </div>
          <aside className="flex flex-col gap-5"><button onClick={() => setIslandOpen((open) => !open)} className={`island-card glass glass-hairline rounded-[28px] p-5 text-left transition hover:-translate-y-0.5 ${islandOpen ? "ring-2 ring-violet-300/70" : ""}`} aria-expanded={islandOpen}><div className="mb-5 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg"><Sparkles size={14} /></span> Dynamic Island</span><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /></div><p className="text-lg font-bold">{islandOpen ? "Jarvis travaille" : "Tout est calme"}</p><p className="mt-1 text-sm text-slate-500">{islandOpen ? "Analyse de ta prochaine demande…" : "Jarvis est prêt à t'aider."}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.08]"><div className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all ${islandOpen ? "w-2/3 animate-pulse" : "w-1/3"}`} /></div><p className="mt-2 text-right text-[11px] text-slate-400">Cliquer pour agrandir</p></button><div className="glass rounded-[28px] p-5"><div className="mb-4 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-[14px] bg-blue-500/10 text-blue-600"><BookOpen size={20} /></div><div><p className="font-semibold">Reprendre tes révisions</p><p className="text-xs text-slate-400">Français · Fiche du jour</p></div></div><button className="btn btn-glass w-full text-sm"><FileText size={16} /> Ouvrir la fiche</button></div></aside>
        </section>
      </main>
      {onboarding && <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/20 p-4 backdrop-blur-sm"><div className="glass glass-strong sheet-in w-full max-w-md rounded-[30px] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">Personnalisation</p><h2 className="mt-1 text-xl font-bold">Ton espace GlassKey</h2></div><button onClick={() => setOnboarding(false)} className="icon-btn" aria-label="Fermer"><X size={18} /></button></div><label className="mt-6 block text-sm font-semibold">Ton prénom<input value={name} onChange={(event) => { setName(event.target.value); window.localStorage.setItem("glasskey-profile", JSON.stringify({ name: event.target.value })); }} className="field mt-2" /></label><div className="mt-5 grid grid-cols-3 gap-2">{["Bleu / blanc", "Rose / blanc", "Violet / nuit"].map((theme) => <button key={theme} className="rounded-2xl border border-slate-900/10 bg-white/50 p-3 text-xs font-medium hover:bg-white/80">{theme}</button>)}</div><button onClick={() => setOnboarding(false)} className="btn btn-primary mt-6 w-full">Enregistrer</button></div></div>}
    </div>
  );
}

export function JarvisSidebarButton() { return <button className="icon-btn" aria-label="Ouvrir Jarvis"><Sparkles size={17} /></button>; }
export function CloseIslandButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="icon-btn" aria-label="Fermer"><X size={17} /></button>; }
export { FolderKanban, ImageIcon, Usb, StickyNote, FileText, MoreHorizontal, Plus, Send, Mic, BookOpen, Sparkles, Check, X };
