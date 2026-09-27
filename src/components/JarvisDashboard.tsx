"use client";

import { useState } from "react";
import {
  BookOpen,
  Check,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Mic,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  StickyNote,
  Usb,
  X,
} from "lucide-react";

const modules = [
  { label: "Clé virtuelle", meta: "3 espaces sécurisés", icon: Usb, tone: "from-sky-400 to-blue-600" },
  { label: "Notes rapides", meta: "2 brouillons récents", icon: StickyNote, tone: "from-amber-300 to-orange-500" },
  { label: "Projets & matières", meta: "Français · 8 documents", icon: FolderKanban, tone: "from-violet-400 to-indigo-600" },
  { label: "Scanner OCR", meta: "Importer un document", icon: ImageIcon, tone: "from-emerald-300 to-teal-600" },
];

export default function JarvisDashboard() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [islandOpen, setIslandOpen] = useState(false);
  const [tasks, setTasks] = useState([
    { title: "Relire le chapitre 4", time: "Aujourd'hui · 17:30", done: false },
    { title: "Devoir de mathématiques", time: "Demain · 18:00", done: false },
  ]);

  const send = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
    window.setTimeout(() => setSent(false), 2600);
  };

  return (
    <section className="rise mt-8 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]" style={{ ["--d" as string]: "0.16s" }}>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="glass glass-hairline overflow-hidden rounded-[30px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-violet-500"><Sparkles size={14} /> Jarvis</p>
              <h2 className="text-xl font-bold tracking-tight">Que veux-tu faire aujourd'hui ?</h2>
            </div>
            <button className="icon-btn" aria-label="Plus d'options"><MoreHorizontal size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {modules.map(({ label, meta, icon: Icon, tone }) => (
              <button key={label} className="group rounded-[22px] border border-slate-900/[0.08] bg-white/35 p-3 text-left transition hover:-translate-y-1 hover:bg-white/70">
                <span className={`mb-3 grid size-10 place-items-center rounded-[14px] bg-gradient-to-br ${tone} text-white shadow-lg`}><Icon size={19} /></span>
                <span className="block text-sm font-semibold leading-tight">{label}</span>
                <span className="mt-1 block text-[11px] leading-snug text-slate-500">{meta}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-end gap-2 rounded-[23px] border border-slate-900/[0.08] bg-white/60 p-2 pl-4 shadow-inner">
            <button className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-slate-900/[0.06] text-slate-500 transition hover:bg-slate-900/10" aria-label="Ajouter une pièce jointe"><Plus size={18} /></button>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); send(); } }} rows={1} placeholder="Écris à Jarvis…" className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-slate-400" />
            <button className="mb-0.5 grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-900/[0.06]" aria-label="Dictée vocale"><Mic size={17} /></button>
            <button onClick={send} disabled={!message.trim()} className={`mb-0.5 grid size-9 shrink-0 place-items-center rounded-full transition ${message.trim() ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25" : "bg-slate-900/[0.08] text-slate-400"}`} aria-label="Envoyer"><Send size={16} /></button>
          </div>
          {sent && <p className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600"><Check size={14} /> Message envoyé à Jarvis</p>}
        </div>

        <div className="glass glass-hairline rounded-[30px] p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">À ne pas oublier</p><h2 className="mt-1 text-lg font-bold">Tes prochaines tâches</h2></div><button className="icon-btn" aria-label="Ajouter une tâche"><Plus size={17} /></button></div>
          <div className="flex flex-col gap-2">
            {tasks.map((task, index) => <button key={task.title} onClick={() => setTasks((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item))} className="flex items-center gap-3 rounded-[18px] bg-white/40 px-3 py-3 text-left transition hover:bg-white/70"><span className={`grid size-6 shrink-0 place-items-center rounded-full border ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-900/15"}`}>{task.done && <Check size={14} />}</span><span className="min-w-0 flex-1"><span className={`block truncate text-sm font-medium ${task.done ? "text-slate-400 line-through" : ""}`}>{task.title}</span><span className="mt-0.5 block text-xs text-slate-400">{task.time}</span></span></button>)}
          </div>
        </div>
      </div>

      <aside className="flex flex-col gap-5">
        <button onClick={() => setIslandOpen((open) => !open)} className={`island-card glass glass-hairline rounded-[28px] p-5 text-left transition hover:-translate-y-0.5 ${islandOpen ? "ring-2 ring-violet-300/70" : ""}`} aria-expanded={islandOpen}>
          <div className="mb-5 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"><span className="grid size-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg"><Sparkles size={14} /></span> Dynamic Island</span><span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" /></div>
          <p className="text-lg font-bold">Tout est calme</p><p className="mt-1 text-sm text-slate-500">Jarvis est prêt à t'aider.</p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.08]"><div className="h-full w-1/3 rounded-full bg-gradient-to-r from-violet-500 to-blue-400" /></div>
          <p className="mt-2 text-right text-[11px] text-slate-400">Cliquer pour agrandir</p>
        </button>
        <div className="glass rounded-[28px] p-5"><div className="mb-4 flex items-center gap-3"><div className="grid size-10 place-items-center rounded-[14px] bg-blue-500/10 text-blue-600"><BookOpen size={20} /></div><div><p className="font-semibold">Reprendre tes révisions</p><p className="text-xs text-slate-400">Français · Fiche du jour</p></div></div><button className="btn btn-glass w-full text-sm"><FileText size={16} /> Ouvrir la fiche</button></div>
      </aside>
    </section>
  );
}

export function JarvisSidebarButton() { return <button className="icon-btn" aria-label="Ouvrir Jarvis"><Sparkles size={17} /></button>; }
export function CloseIslandButton({ onClick }: { onClick: () => void }) { return <button onClick={onClick} className="icon-btn" aria-label="Fermer"><X size={17} /></button>; }

export { FolderKanban };
export { ImageIcon };
export { Usb };
export { StickyNote };
export { FileText };
export { MoreHorizontal };
export { Plus };
export { Send };
export { Mic };
export { BookOpen };
export { Sparkles };
export { Check };
export { X };
