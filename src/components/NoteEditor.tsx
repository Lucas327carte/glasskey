"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ALargeSmall,
  Check,
  Eye,
  Loader2,
  PencilLine,
  Type,
  X,
} from "lucide-react";
import { api, NodeMeta } from "@/lib/api";
import { cx } from "@/lib/util";

type Mode = "view" | "edit";

const FONTS = [
  { label: "Sans", cls: "font-sans" },
  { label: "Sérif", cls: "font-serif" },
  { label: "Mono", cls: "font-mono" },
] as const;

const SIZES = [
  { label: "Pt", cls: "text-[14px] leading-7" },
  { label: "Md", cls: "text-[17px] leading-8" },
  { label: "Lg", cls: "text-[20px] leading-9" },
] as const;

function withTxtExt(name: string): string {
  return /\.[a-z0-9]{1,5}$/i.test(name) ? name : `${name}.txt`;
}

export default function NoteEditor({
  driveId,
  parentId,
  node,
  initialMode,
  onClose,
  onSaved,
}: {
  driveId: string;
  parentId: string | null;
  node: NodeMeta | null;
  initialMode: Mode;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState(() =>
    node ? node.name.replace(/\.txt$/i, "") : "",
  );
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(!node); // nouveau doc → déjà chargé
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false); // petit retour visuel "✓ Enregistré"
  const [error, setError] = useState<string | null>(null);
  const [fontIdx, setFontIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(1);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  /* ── charge le contenu si c'est un doc existant ── */
  useEffect(() => {
    if (!node) return;
    let alive = true;
    fetch(`/api/files/${node.id}`)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((t) => {
        if (!alive) return;
        setContent(t);
        setLoaded(true);
      })
      .catch(() => {
        if (!alive) return;
        setError("Impossible de charger le document.");
        setLoaded(true);
      });
    return () => { alive = false; };
  }, [node]);

  /* ── focus textarea quand on passe en édition ── */
  useEffect(() => {
    if (mode === "edit" && loaded) {
      const el = areaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [mode, loaded]);

  const words = useMemo(
    () => (content.trim() ? content.trim().split(/\s+/).length : 0),
    [content],
  );

  const save = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const finalName = withTxtExt(title.trim() || "Sans titre");
    try {
      if (node) {
        await api(`/api/files/${node.id}`, {
          method: "PATCH",
          body: { name: finalName, content },
        });
      } else {
        await api(`/api/drives/${driveId}/notes`, {
          body: { name: finalName, parentId, content },
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
      // Si c'est un nouveau doc, ferme après sauvegarde
      if (!node) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setBusy(false);
    }
  }, [busy, title, content, node, driveId, parentId, onSaved, onClose]);

  const editing = mode === "edit";
  const fontCls = FONTS[fontIdx].cls;
  const sizeCls = SIZES[sizeIdx].cls;

  return (
    <div className="fixed inset-0 z-[95] flex flex-col">
      {/* fond flouté */}
      <div className="absolute inset-0 bg-slate-100/85 backdrop-blur-2xl" />

      <div className="sheet-in relative mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
        <div className="glass-strong flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px]">

          {/* ── barre du haut ── */}
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-900/10 px-3 py-2.5 sm:px-5 sm:py-3">
            {/* fermer */}
            <button
              onClick={onClose}
              className="icon-btn shrink-0"
              style={{ height: "2.25rem", width: "2.25rem" }}
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            {/* vue / modifier */}
            <button
              onClick={() => setMode(editing ? "view" : "edit")}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-all active:scale-95",
                editing
                  ? "border-slate-900/15 bg-slate-100 text-slate-600"
                  : "border-sky-500/30 bg-sky-500/10 text-sky-600",
              )}
            >
              {editing ? <Eye size={14} /> : <PencilLine size={14} />}
              <span className="hidden sm:inline">{editing ? "Aperçu" : "Modifier"}</span>
            </button>

            {/* séparateur discret */}
            <div className="mx-1 hidden h-5 w-px bg-slate-900/10 sm:block" />

            {/* options police & taille — icônes seules sur mobile */}
            <button
              onClick={() => setFontIdx((i) => (i + 1) % FONTS.length)}
              className="flex items-center gap-1 rounded-full border border-slate-900/10 bg-white/60 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white active:scale-95"
              title="Changer de police"
            >
              <Type size={13} />
              <span className="hidden sm:inline">{FONTS[fontIdx].label}</span>
            </button>
            <button
              onClick={() => setSizeIdx((i) => (i + 1) % SIZES.length)}
              className="flex items-center gap-1 rounded-full border border-slate-900/10 bg-white/60 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-white active:scale-95"
              title="Changer la taille"
            >
              <ALargeSmall size={13} />
              <span className="hidden sm:inline">{SIZES[sizeIdx].label}</span>
            </button>

            <div className="flex-1" />

            {/* compteur — caché sur très petit mobile */}
            <span className="hidden text-[11px] text-slate-400 sm:block">
              {words} mot{words > 1 ? "s" : ""}
            </span>

            {/* enregistrer */}
            <button
              onClick={save}
              disabled={busy || !loaded}
              className={cx(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-all active:scale-95",
                saved
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-900 text-white hover:bg-slate-700",
                (busy || !loaded) && "opacity-50 pointer-events-none",
              )}
            >
              {busy ? (
                <Loader2 size={14} className="spin-slow" />
              ) : saved ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <Check size={14} strokeWidth={2.5} />
              )}
              <span className="hidden sm:inline">
                {busy ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
              </span>
            </button>
          </div>

          {/* ── titre ── */}
          <div className="shrink-0 px-5 pt-4 pb-2 sm:px-7">
            {editing ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre du document"
                maxLength={76}
                className="w-full bg-transparent text-2xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300 sm:text-3xl"
              />
            ) : (
              <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title.trim() || <span className="text-slate-300">Sans titre</span>}
              </h2>
            )}
            <div className="mt-2 h-px bg-gradient-to-r from-slate-900/12 to-transparent" />
          </div>

          {/* ── corps ── */}
          {!loaded ? (
            <div className="grid flex-1 place-items-center p-8">
              <Loader2 size={26} className="spin-slow text-slate-400" />
            </div>
          ) : editing ? (
            <textarea
              ref={areaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                  e.preventDefault();
                  save();
                }
              }}
              placeholder={"Commence à écrire…\n\nCtrl + S pour enregistrer rapidement."}
              className={cx(
                "no-scrollbar min-h-0 w-full flex-1 resize-none bg-transparent px-5 py-3 text-slate-800 outline-none placeholder:text-slate-300 sm:px-7",
                fontCls,
                sizeCls,
              )}
            />
          ) : (
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-7">
              {content.trim() ? (
                <p
                  className={cx(
                    "whitespace-pre-wrap text-slate-800",
                    fontCls,
                    sizeCls,
                  )}
                >
                  {content}
                </p>
              ) : (
                <button
                  onClick={() => setMode("edit")}
                  className="mt-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Document vide — toucher pour écrire.
                </button>
              )}
            </div>
          )}

          {/* ── erreur ── */}
          {error && (
            <p className="shrink-0 border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm text-rose-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
