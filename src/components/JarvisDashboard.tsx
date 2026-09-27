"use client";

import { useMemo, useState } from "react";
import {
  Bell, BookOpen, Check, FileText, FolderKanban, Image as ImageIcon, Library,
  Mic, MoreHorizontal, Plus, Search, Send, Settings, Sparkles, Square, StickyNote,
  Usb, X,
} from "lucide-react";

type Module = "key" | "notes" | "projects" | "ocr" | null;
type Task = { title: string; time: string; done: boolean };

const modules = [
  { id: "key" as const, label: "Clé virtuelle", meta: "3 espaces sécurisés", icon: Usb, tone: "from-sky-400 to-blue-600" },
  { id: "notes" as const, label: "Notes rapides", meta: "2 brouillons récents", icon: StickyNote, tone: "from-amber-300 to-orange-500" },
  { id: "projects" as const, label: "Projets & matières", meta: "Français · 8 documents", icon: FolderKanban, tone: "from-violet-400 to-indigo-600" },
  { id: "ocr" as const, label: "Scanner OCR", meta: "Importer un document", icon: ImageIcon, tone: "from-emerald-300 to-teal-600" },
];
const chats = ["Révisions de français", "Organisation de la semaine", "Idées de projet"];

export default function JarvisDashboard() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [islandOpen, setIslandOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [listening, setListening] = useState(false);
  const [module, setModule] = useState<Module>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [name, setName] = useState("Lucas");
  const [note, setNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([
    { title: "Relire le chapitre 4", time: "Aujourd'hui · 17:30", done: false },
    { title: "Devoir de mathématiques", time: "Demain · 18:00", done: false },
  ]);
  const greeting = useMemo(() => new Date().getHours() < 18 ? "Bon après-midi" : "Bonsoir", []);

  const send = () => {
    const value = message.trim();
    if (!value) return;
    setMessages((current) => [...current, value]);
    setMessage("");
    setIslandOpen(true);
  };
  const addTask = () => {
    const title = newTask.trim();
    if (!title) return;
    setTasks((current) => [...current, { title, time: "À planifier", done: false }]);
    setNewTask("");
  };

  return (
    <div className="relative flex min-h-dvh w-full gap-4 p-3 sm:p-5">
      <aside className={`${sidebarOpen ? "w-[264px]" : "w-[58px]"} glass glass-strong hidden shrink-0 flex-col rounded-[28px] p-3 transition-[width] duration-500 lg:flex`}>
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          <button onClick={() => setSidebarOpen((open) => !open)} className="flex items-center gap-2 font-bold" aria-label="Ouvrir ou fermer Jarvis"><span className="grid size-9 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br from-violet-500 via-blue-500 to-cyan-400 text-white shadow-lg"><Sparkles size={18} /></span>{sidebarOpen && <span className="text-lg">Jarvis</span>}</button>
          {sidebarOpen && <button onClick={() => setSidebarOpen(false)} className="icon-btn size-8" aria-label="Fermer la barre latérale"><X size={15} /></button>}
        </div>
        <nav className="mt-7 flex flex-col gap-1" aria-label="Navigation Jarvis">
          <button onClick={() => { setMessages([]); setIslandOpen(false); }} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-white/70"><Plus size={17} />{sidebarOpen && "Nouvelle discussion"}</button>
          <button onClick={() => setShowNotifications(true)} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-white/70"><Search size={17} />{sidebarOpen && "Rechercher"}</button>
          <button onClick={() => setModule("projects")} className="flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:bg-white/70"><Library size={17} />{sidebarOpen && "Bibliothèque"}</button>
        </nav>
        {sidebarOpen && <><p className="mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Récentes</p><div className="mt-2 flex flex-col gap-1">{chats.map((chat) => <button onClick={() => { setIslandOpen(true); setMessages([chat]); }} key={chat} className="truncate rounded-2xl px-3 py-2.5 text-left text-sm text-slate-600 hover:bg-white/65">{chat}</button>)}</div></>}
        <div className="mt-auto flex items-center gap-2 border-t border-slate-900/10 px-2 pt-3"><div className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-sm font-bold text-white">{name[0]}</div>{sidebarOpen && <><span className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</span><button className="icon-btn size-8" onClick={() => setShowSettings(true)} aria-label="Paramètres"><Settings size={15} /></button></>}</div>
      </aside>

      <main className="mx-auto flex w-full max-w-6xl min-w-0 flex-col pb-5">
        <header className="flex items-center justify-between gap-4 px-1 py-2 sm:px-3"><div><p className="text-sm font-medium text-slate-500">{greeting},</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bonjour {name}</h1></div><div className="flex items-center gap-2"><button onClick={() => setShowNotifications(true)} className="icon-btn" aria-label="Notifications"><Bell size={18} /></button><button onClick={() => setShowSettings(true)} className="icon-btn lg:hidden" aria-label="Paramètres"><Settings size={18} /></button><button onClick={() => setIslandOpen((open) => !open)} className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-blue-500/20" aria-label="Ouvrir Jarvis"><Sparkles size={20} /></button></div></header>

        <section className="rise mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]" style={{ ["--d" as string]: "0.16s" }}>
          <div className="flex min-w-0 flex-col gap-5">
            <div className="glass glass-hairline overflow-hidden rounded-[30px] p-5 sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><div><p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-500"><Sparkles size={14} /> Jarvis</p><h2 className="text-xl font-bold tracking-tight">Que veux-tu faire aujourd&apos;hui ?</h2></div><button onClick={() => setShowSettings(true)} className="icon-btn" aria-label="Plus d’options"><MoreHorizontal size={18} /></button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{modules.map(({ id, label, meta, icon: Icon, tone }) => <button key={id} onClick={() => setModule(id)} className="group rounded-[22px] border border-slate-900/[0.08] bg-white/35 p-3 text-left transition hover:-translate-y-1 hover:bg-white/70"><span className={`mb-3 grid size-10 place-items-center rounded-[14px] bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon size={19} /></span><span className="block text-sm font-semibold leading-tight">{label}</span><span className="mt-1 block text-[11px] leading-snug text-slate-500">{meta}</span></button>)}</div>
              <div className="mt-5 flex items-end gap-2 rounded-[23px] border border-slate-900/[0.08] bg-white/60 p-2 pl-4 shadow-inner">{!listening && <button onClick={() => setModule("ocr")} className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-slate-900/[0.06] text-slate-500" aria-label="Ajouter une pièce jointe"><Plus size={18} /></button>}{listening ? <div className="flex h-9 flex-1 items-center justify-center gap-1.5" aria-label="Enregistrement en cours">{Array.from({ length: 18 }, (_, index) => <i key={index} className="voice-bar" style={{ ["--i" as string]: index }} />)}</div> : <textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) { event.preventDefault(); send(); } }} rows={1} placeholder="Écris à Jarvis…" className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" aria-label="Message à Jarvis" />}{listening ? <button onClick={() => setListening(false)} className="grid size-9 place-items-center rounded-full bg-slate-900 text-white" aria-label="Arrêter la dictée"><Square size={14} fill="currentColor" /></button> : <button onClick={() => setListening(true)} className="icon-btn size-9" aria-label="Dictée vocale"><Mic size={17} /></button>}<button onClick={send} className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/25" aria-label="Envoyer"><Send size={16} /></button></div>
              {messages.length > 0 && <div className="mt-3 flex flex-col gap-2">{messages.map((item, index) => <div key={`${item}-${index}`} className="fade-in self-end rounded-2xl rounded-br-md bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2 text-sm text-white shadow-lg">{item}</div>)}</div>}
            </div>
            <div className="glass glass-hairline rounded-[30px] p-5 sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">À ne pas oublier</p><h2 className="mt-1 text-lg font-bold">Tes prochaines tâches</h2></div><button onClick={() => setNewTask(" ")} className="icon-btn" aria-label="Ajouter une tâche"><Plus size={17} /></button></div><div className="flex flex-col gap-2">{tasks.map((task, index) => <button key={`${task.title}-${index}`} onClick={() => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} className="flex items-center gap-3 rounded-[18px] bg-white/40 px-3 py-3 text-left transition hover:bg-white/70"><span className={`grid size-6 shrink-0 place-items-center rounded-full border ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-900/15"}`}>{task.done && <Check size={14} />}</span><span className="min-w-0 flex-1"><span className={`block truncate text-sm font-medium ${task.done ? "text-slate-400 line-through" : ""}`}>{task.title}</span><span className="mt-0.5 block text-xs text-slate-400">{task.time}</span></span></button>)}</div>{newTask !== "" && <div className="mt-3 flex gap-2"><input autoFocus value={newTask.trim()} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTask(); }} placeholder="Nouvelle tâche" className="field flex-1" /><button onClick={addTask} className="btn btn-primary px-4">Ajouter</button></div>}</div>
          </div>
          <aside className="flex flex-col gap-5"><button onClick={() => setIslandOpen((open) => !open)} className={`island-card glass glass-hairline rounded-[28px] p-5 text-left transition hover:-translate-y-0.5 ${islandOpen ? "ring-2 ring-violet-300/70" : ""}`} aria-expanded={islandOpen}><div className="mb-5 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg"><Sparkles size={14} /></span> Dynamic Island</span><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /></div><p className="text-lg font-bold">{islandOpen ? "Jarvis travaille" : "Tout est calme"}</p><p className="mt-1 text-sm text-slate-500">{islandOpen ? "Analyse de ta prochaine demande…" : "Jarvis est prêt à t’aider."}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.08]"><div className={`h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all ${islandOpen ? "w-2/3 animate-pulse" : "w-1/3"}`} /></div><p className="mt-2 text-right text-[11px] text-slate-400">Cliquer pour agrandir</p></button><div className="glass rounded-[28px] p-5"><div className="mb-4 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-[14px] bg-blue-500/10 text-blue-600"><BookOpen size={20} /></div><div><p className="font-semibold">Reprendre tes révisions</p><p className="text-xs text-slate-400">Français · Fiche du jour</p></div></div><button onClick={() => setModule("notes")} className="btn btn-glass w-full text-sm"><FileText size={16} /> Ouvrir la fiche</button></div></aside>
        </section>
      </main>
      {(module || showSettings || showNotifications) && <Modal title={showSettings ? "Ton espace GlassKey" : showNotifications ? "Notifications" : modules.find((item) => item.id === module)?.label || "Jarvis"} onClose={() => { setModule(null); setShowSettings(false); setShowNotifications(false); }}>
        {showSettings ? <><label className="block text-sm font-semibold">Ton prénom<input value={name} onChange={(event) => setName(event.target.value)} className="field mt-2" /></label><button onClick={() => setShowSettings(false)} className="btn btn-primary mt-5 w-full">Enregistrer</button></> : showNotifications ? <p className="rounded-2xl bg-white/50 p-4 text-sm text-slate-600">Tout est à jour. Jarvis te préviendra ici.</p> : module === "key" ? <><p className="text-sm text-slate-500">Explore tes espaces sécurisés.</p>{["Cours", "Documents personnels", "Projets créatifs"].map((item) => <button key={item} className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-white/50 p-4 text-left hover:bg-white/80"><Usb size={17} className="text-blue-500" />{item}</button>)}</> : module === "notes" ? <><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Écris ta note ici…" className="field min-h-36 resize-y" /><button onClick={() => setModule(null)} className="btn btn-primary mt-4 w-full">Sauvegarder la note</button></> : module === "projects" ? <div className="grid gap-2 sm:grid-cols-2">{["Français", "Mathématiques", "Sciences", "Arts"].map((item) => <button key={item} className="rounded-2xl bg-white/50 p-4 text-left font-semibold hover:bg-white/80"><FolderKanban className="mb-2 text-violet-500" size={19} />{item}<span className="mt-1 block text-xs font-normal text-slate-400">8 documents</span></button>)}</div> : <><label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-400/50 bg-white/35 text-sm text-slate-500"><ImageIcon size={26} className="mb-2 text-emerald-500" />Importer une photo ou un document<input type="file" accept="image/*,.pdf" className="sr-only" /></label><button onClick={() => setModule(null)} className="btn btn-primary mt-4 w-full">Numériser le document</button></>}
      </Modal>}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="fixed inset-0 z-30 grid place-items-center bg-slate-950/20 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="glass glass-strong sheet-in w-full max-w-md rounded-[30px] p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button onClick={onClose} className="icon-btn" aria-label="Fermer"><X size={18} /></button></div>{children}</div></div>;
}

export function JarvisSidebarButton() { return <button className="icon-btn" aria-label="Ouvrir Jarvis"><Sparkles size={17} /></button>; }
export function CloseIslandButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="icon-btn" aria-label="Fermer"><X size={17} /></button>; }
export { FolderKanban, ImageIcon, Usb, StickyNote, FileText, MoreHorizontal, Plus, Send, Mic, BookOpen, Sparkles, Check, X };
