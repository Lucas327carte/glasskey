"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Library,
  Pencil,
  Search,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { cx, firstName } from "@/lib/util";

export type Conversation = {
  id: string;
  title: string;
  pinned: boolean;
  updatedAt: string;
};

type SidebarProps = {
  username: string;
  conversations: Conversation[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onPinChat: (id: string) => void;
  onRenameChat: (id: string, title: string) => void;
  activeChatId: string | null;
  onOpenSettings: () => void;
  onOpenLibrary: () => void;
};

export default function Sidebar({
  username,
  conversations,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onPinChat,
  onRenameChat,
  activeChatId,
  onOpenSettings,
  onOpenLibrary,
}: SidebarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [optionsFor, setOptionsFor] = useState<string | null>(null);

  const toggle = useCallback(() => setExpanded((e) => !e), []);
  const close = useCallback(() => setExpanded(false), []);

  const sorted = [...conversations].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const filtered = search
    ? sorted.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : sorted;

  const handleRename = (id: string, current: string) => {
    setEditingId(id);
    setEditTitle(current);
    setOptionsFor(null);
  };

  const commitRename = () => {
    if (editingId && editTitle.trim()) {
      onRenameChat(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* overlay */}
      <div
        className={cx("sidebar-overlay", expanded && "show")}
        onClick={close}
        aria-hidden
      />

      <nav className={cx("sidebar", expanded ? "sidebar-expanded" : "sidebar-collapsed")}>
        {/* collapsed rail */}
        <div className="sidebar-rail glass">
          {/* star logo */}
          <button
            onClick={toggle}
            className="icon-btn h-11 w-11"
            aria-label="Ouvrir le menu"
            title="Menu"
          >
            <Sparkles size={20} className="text-amber-500" />
          </button>

          <div className="my-1 h-px w-7 bg-slate-900/10" />

          <button
            onClick={() => { onNewChat(); close(); }}
            className="icon-btn h-10 w-10"
            aria-label="Nouvelle discussion"
            title="Nouvelle discussion"
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={toggle}
            className="icon-btn h-10 w-10"
            aria-label="Rechercher"
            title="Rechercher"
          >
            <Search size={17} />
          </button>
          <button
            onClick={() => { onOpenLibrary(); close(); }}
            className="icon-btn h-10 w-10"
            aria-label="Bibliothèque"
            title="Bibliothèque"
          >
            <Library size={17} />
          </button>
          <button
            onClick={() => { onOpenSettings(); close(); }}
            className="icon-btn h-10 w-10"
            aria-label="Paramètres"
            title="Paramètres"
          >
            <Settings size={17} />
          </button>

          <div className="mt-auto">
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-xs font-bold text-white shadow-md"
              aria-label="Profil"
              title={firstName(username)}
            >
              {firstName(username).charAt(0)}
            </button>
          </div>
        </div>

        {/* expanded panel */}
        <div className="sidebar-panel glass-strong">
          {/* header */}
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-violet-500 shadow-md">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Jarvis</span>
            </div>
            <button
              onClick={close}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-900/10 bg-slate-900/[0.04] transition-colors hover:bg-slate-900/[0.08]"
              aria-label="Fermer la barre latérale"
              title="Fermer la barre latérale"
            >
              <X size={16} />
            </button>
          </div>

          {/* main menu */}
          <div className="mb-4 space-y-1">
            <button
              onClick={() => { onNewChat(); close(); }}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/[0.06]"
            >
              <Pencil size={17} className="text-slate-500" />
              Nouvelle discussion
            </button>
            <button
              onClick={() => { onOpenLibrary(); close(); }}
              className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-900/[0.06]"
            >
              <Library size={17} className="text-slate-500" />
              Bibliothèque
            </button>
          </div>

          {/* search */}
          <div className="mb-2">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-900/10 bg-slate-900/[0.04] px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* recent conversations */}
          <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Récentes
          </p>
          <div className="no-scrollbar flex-1 space-y-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-1 py-4 text-center text-sm text-slate-400">
                Aucune discussion
              </p>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className="relative">
                  {editingId === c.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => e.key === "Enter" && commitRename()}
                      className="w-full rounded-xl border border-sky-500/50 bg-white/80 px-3 py-2 text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { onSelectChat(c.id); close(); }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setOptionsFor(optionsFor === c.id ? null : c.id);
                      }}
                      className={cx(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                        activeChatId === c.id
                          ? "bg-slate-900/[0.08] font-semibold text-slate-900"
                          : "text-slate-600 hover:bg-slate-900/[0.05]",
                      )}
                    >
                      {c.pinned && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      )}
                      <span className="truncate">{c.title}</span>
                    </button>
                  )}

                  {/* options popup */}
                  {optionsFor === c.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOptionsFor(null)} />
                      <div className="sheet-in glass-strong absolute right-2 top-10 z-20 w-44 rounded-2xl p-2 shadow-xl">
                        <button
                          onClick={() => { handleRename(c.id, c.title); }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-900/[0.06]"
                        >
                          <Pencil size={14} /> Renommer
                        </button>
                        <button
                          onClick={() => { onPinChat(c.id); setOptionsFor(null); }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-900/[0.06]"
                        >
                          {c.pinned ? "Détacher" : "Épingler"}
                        </button>
                        <button
                          onClick={() => { onDeleteChat(c.id); setOptionsFor(null); }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-600 hover:bg-rose-500/10"
                        >
                          Supprimer
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* footer */}
          <div className="mt-3 flex items-center gap-3 border-t border-slate-900/10 pt-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-sm font-bold text-white shadow-md">
              {firstName(username).charAt(0)}
            </div>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              {firstName(username)}
            </span>
            <button
              onClick={() => { onOpenSettings(); close(); }}
              className="icon-btn h-9 w-9"
              aria-label="Paramètres"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
