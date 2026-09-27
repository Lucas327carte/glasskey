"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ALargeSmall,
  Bold,
  Check,
  ChevronDown,
  Eraser,
  Eye,
  Highlighter,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Palette,
  PencilLine,
  Plus,
  Quote,
  Redo2,
  Strikethrough,
  Type,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import { api, NodeMeta } from "@/lib/api";
import { cx } from "@/lib/util";

type Mode = "view" | "edit";
type Panel = "font" | "size" | "color" | null;

const FONTS = [
  { label: "Sans", family: 'system-ui, -apple-system, "SF Pro Display", "Segoe UI", sans-serif' },
  { label: "Sérif", family: 'Georgia, "Times New Roman", Times, serif' },
  { label: "Mono", family: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace' },
  { label: "Arial", family: "Arial, Helvetica, sans-serif" },
  { label: "Verdana", family: "Verdana, Geneva, sans-serif" },
  { label: "Tahoma", family: "Tahoma, Geneva, sans-serif" },
  { label: "Trebuchet", family: '"Trebuchet MS", Tahoma, sans-serif' },
  { label: "Georgia", family: "Georgia, serif" },
  { label: "Times", family: '"Times New Roman", Times, serif' },
  { label: "Palatino", family: '"Palatino Linotype", Palatino, serif' },
  { label: "Garamond", family: "Garamond, Georgia, serif" },
  { label: "Cambria", family: "Cambria, Georgia, serif" },
  { label: "Courier", family: '"Courier New", Courier, monospace' },
] as const;

const SIZE_PRESETS = [11, 12, 13, 14, 16, 17, 18, 20, 22, 24, 28, 32, 36, 48];
const LINE_PRESETS = [
  { label: "Serré", value: 1.15 },
  { label: "Normal", value: 1.6 },
  { label: "Large", value: 1.85 },
  { label: "Double", value: 2 },
] as const;

const HEADINGS = [
  { label: "Corps", tag: "div" },
  { label: "Titre 1", tag: "h1" },
  { label: "Titre 2", tag: "h2" },
  { label: "Titre 3", tag: "h3" },
] as const;

const TEXT_COLORS = [
  "#0f172a",
  "#334155",
  "#64748b",
  "#0284c7",
  "#0d9488",
  "#4f46e5",
  "#c026d3",
  "#e11d48",
  "#d97706",
  "#16a34a",
];

const HIGHLIGHTS = [
  "transparent",
  "#fef08a",
  "#bbf7d0",
  "#bae6fd",
  "#ddd6fe",
  "#fecdd3",
  "#fed7aa",
];

function withTxtExt(name: string): string {
  return /\.[a-z0-9]{1,5}$/i.test(name) ? name : `${name}.txt`;
}

function looksLikeHtml(s: string) {
  return /<(div|span|p|br|b|i|u|strong|em|ul|ol|li|font|h[1-6]|blockquote)\b/i.test(s);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function textToHtml(t: string) {
  if (!t) return "";
  if (looksLikeHtml(t)) return t;
  return escapeHtml(t).replace(/\n/g, "<br>");
}

function htmlToPlain(html: string) {
  if (typeof document === "undefined") return html;
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.innerText || d.textContent || "").replace(/\u00a0/g, " ");
}

function clampSize(n: number) {
  return Math.min(72, Math.max(8, Math.round(n)));
}

function Chip({
  active,
  title,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  title?: string;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cx(
        "flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors active:scale-95",
        active
          ? "border-sky-500/30 bg-sky-500/10 text-sky-700"
          : "border-slate-900/10 bg-white/60 text-slate-600 hover:bg-white",
        className,
      )}
    >
      {children}
    </button>
  );
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
  const [loaded, setLoaded] = useState(!node);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontIdx, setFontIdx] = useState(0);
  const [fontSize, setFontSize] = useState(17);
  const [lineHeight, setLineHeight] = useState(1.6);
  const [align, setAlign] = useState<"left" | "center" | "right" | "justify">("left");
  const [panel, setPanel] = useState<Panel>(null);
  const [fmt, setFmt] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    ul: false,
    ol: false,
  });
  const areaRef = useRef<HTMLDivElement>(null);
  const seeded = useRef(false);

  useEffect(() => {
    if (!node) return;
    let alive = true;

    const loadDocument = async () => {
      try {
        const response = await fetch(`/api/files/${node.id}`);
        if (!response.ok) throw new Error("Document unavailable");
        const text = await response.text();
        if (!alive) return;
        setContent(text);
      } catch {
        if (!alive) return;
        setError("Impossible de charger le document.");
      } finally {
        if (alive) setLoaded(true);
      }
    };

    void loadDocument();
    return () => {
      alive = false;
    };
  }, [node]);

  useEffect(() => {
    if (mode !== "edit" || !loaded) {
      seeded.current = false;
      return;
    }
    const el = areaRef.current;
    if (!el || seeded.current) return;
    el.innerHTML = textToHtml(content);
    seeded.current = true;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    el.focus();
  }, [mode, loaded, content]);

  useEffect(() => {
    const onSel = () => {
      const el = areaRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (!sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
      setFmt({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
        ul: document.queryCommandState("insertUnorderedList"),
        ol: document.queryCommandState("insertOrderedList"),
      });
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const words = useMemo(() => {
    const plain = htmlToPlain(content).trim();
    return plain ? plain.split(/\s+/).length : 0;
  }, [content]);

  const chars = useMemo(() => htmlToPlain(content).replace(/\s/g, "").length, [content]);
  const empty = !htmlToPlain(content).trim();

  const sync = useCallback(() => {
    const el = areaRef.current;
    if (el) setContent(el.innerHTML);
  }, []);

  const run = useCallback(
    (cmd: string, value?: string) => {
      areaRef.current?.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand(cmd, false, value);
      sync();
    },
    [sync],
  );

  const applyFont = useCallback(
    (idx: number) => {
      setFontIdx(idx);
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && areaRef.current?.contains(sel.anchorNode)) {
        run("fontName", FONTS[idx].family);
      }
    },
    [run],
  );

  const applySize = useCallback(
    (px: number) => {
      const next = clampSize(px);
      setFontSize(next);
      const sel = window.getSelection();
      const el = areaRef.current;
      if (!el || !sel || sel.isCollapsed || !el.contains(sel.anchorNode)) return;
      el.focus();
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, "7");
      el.querySelectorAll('font[size="7"], span').forEach((node) => {
        const span = node as HTMLElement;
        const fs = span.style.fontSize;
        if (span.getAttribute("size") === "7" || fs === "xxx-large" || fs === "48px") {
          span.removeAttribute("size");
          span.style.fontSize = `${next}px`;
        }
      });
      sync();
    },
    [sync],
  );

  const applyColor = useCallback(
    (color: string) => {
      run("foreColor", color);
      setPanel(null);
    },
    [run],
  );

  const applyHighlight = useCallback(
    (color: string) => {
      run("hiliteColor", color === "transparent" ? "transparent" : color);
      setPanel(null);
    },
    [run],
  );

  const save = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const finalName = withTxtExt(title.trim() || "Sans titre");
    const html = areaRef.current?.innerHTML ?? content;
    try {
      if (node) {
        await api(`/api/files/${node.id}`, {
          method: "PATCH",
          body: { name: finalName, content: html },
        });
      } else {
        await api(`/api/drives/${driveId}/notes`, {
          body: { name: finalName, parentId, content: html },
        });
      }
      setContent(html);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSaved();
      if (!node) onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'enregistrement");
    } finally {
      setBusy(false);
    }
  }, [busy, title, content, node, driveId, parentId, onSaved, onClose]);

  const editing = mode === "edit";
  const fontFamily = FONTS[fontIdx].family;

  const togglePanel = (p: Panel) => setPanel((cur) => (cur === p ? null : p));

  return (
    <div className="fixed inset-0 z-[95] flex flex-col">
      <div className="absolute inset-0 bg-slate-100/85 backdrop-blur-2xl" />

      <div className="sheet-in relative mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-3 py-3 sm:px-5 sm:py-5">
        <div className="glass-strong relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px]">
          {/* ── barre du haut ── */}
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-900/10 px-3 py-2.5 sm:px-5 sm:py-3">
            <button
              onClick={onClose}
              className="icon-btn shrink-0"
              style={{ height: "2.25rem", width: "2.25rem" }}
              aria-label="Fermer"
            >
              <X size={16} />
            </button>

            <button
              onClick={() => {
                setPanel(null);
                setMode(editing ? "view" : "edit");
              }}
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

            <div className="flex-1" />

            <span className="hidden text-[11px] text-slate-400 sm:block">
              {words} mot{words > 1 ? "s" : ""} · {chars} car.
            </span>

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
              ) : (
                <Check size={14} strokeWidth={saved ? 3 : 2.5} />
              )}
              <span className="hidden sm:inline">
                {busy ? "Enregistrement…" : saved ? "Enregistré !" : "Enregistrer"}
              </span>
            </button>
          </div>

          {/* ── barre de formatage ── */}
          {editing && (
            <div className="relative shrink-0 border-b border-slate-900/10">
              <div className="no-scrollbar flex flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain px-3 py-2 sm:px-5">
                <Chip title="Annuler" onClick={() => run("undo")}>
                  <Undo2 size={14} />
                </Chip>
                <Chip title="Rétablir" onClick={() => run("redo")}>
                  <Redo2 size={14} />
                </Chip>

                <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-900/10" />

                <Chip
                  title="Police"
                  active={panel === "font"}
                  onClick={() => togglePanel("font")}
                  className="min-w-[5.6rem] justify-between px-2.5"
                >
                  <Type size={13} />
                  <span className="max-w-[4.2rem] truncate">{FONTS[fontIdx].label}</span>
                  <ChevronDown size={12} className="opacity-50" />
                </Chip>
                <Chip
                  title="Taille du texte"
                  active={panel === "size"}
                  onClick={() => togglePanel("size")}
                >
                  <ALargeSmall size={13} />
                  <span className="tabular-nums">{fontSize}</span>
                </Chip>

                <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-900/10" />

                <Chip title="Gras" active={fmt.bold} onClick={() => run("bold")}>
                  <Bold size={14} />
                </Chip>
                <Chip title="Italique" active={fmt.italic} onClick={() => run("italic")}>
                  <Italic size={14} />
                </Chip>
                <Chip title="Souligné" active={fmt.underline} onClick={() => run("underline")}>
                  <Underline size={14} />
                </Chip>
                <Chip title="Barré" active={fmt.strike} onClick={() => run("strikeThrough")}>
                  <Strikethrough size={14} />
                </Chip>
                <Chip title="Couleur" active={panel === "color"} onClick={() => togglePanel("color")}>
                  <Palette size={14} />
                </Chip>

                <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-900/10" />

                <Chip
                  title="Aligner à gauche"
                  active={align === "left"}
                  onClick={() => {
                    setAlign("left");
                    run("justifyLeft");
                  }}
                >
                  <AlignLeft size={14} />
                </Chip>
                <Chip
                  title="Centrer"
                  active={align === "center"}
                  onClick={() => {
                    setAlign("center");
                    run("justifyCenter");
                  }}
                >
                  <AlignCenter size={14} />
                </Chip>
                <Chip
                  title="Aligner à droite"
                  active={align === "right"}
                  onClick={() => {
                    setAlign("right");
                    run("justifyRight");
                  }}
                >
                  <AlignRight size={14} />
                </Chip>
                <Chip
                  title="Justifier"
                  active={align === "justify"}
                  onClick={() => {
                    setAlign("justify");
                    run("justifyFull");
                  }}
                >
                  <AlignJustify size={14} />
                </Chip>

                <div className="mx-0.5 h-5 w-px shrink-0 bg-slate-900/10" />

                <Chip title="Liste à puces" active={fmt.ul} onClick={() => run("insertUnorderedList")}>
                  <List size={14} />
                </Chip>
                <Chip title="Liste numérotée" active={fmt.ol} onClick={() => run("insertOrderedList")}>
                  <ListOrdered size={14} />
                </Chip>
                <Chip title="Citation" onClick={() => run("formatBlock", "blockquote")}>
                  <Quote size={14} />
                </Chip>
                <Chip title="Diminuer le retrait" onClick={() => run("outdent")}>
                  <IndentDecrease size={14} />
                </Chip>
                <Chip title="Augmenter le retrait" onClick={() => run("indent")}>
                  <IndentIncrease size={14} />
                </Chip>
                <Chip title="Effacer la mise en forme" onClick={() => run("removeFormat")}>
                  <Eraser size={14} />
                </Chip>
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-7 bg-gradient-to-l from-white/80 to-transparent sm:hidden" />

              {panel && (
                <>
                  <button
                    type="button"
                    aria-label="Fermer le panneau"
                    className="absolute inset-x-0 top-full z-10 h-[70vh]"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setPanel(null)}
                  />
                  <div className="menu-in glass-strong absolute left-3 right-3 top-full z-20 mt-1.5 max-h-[min(62vh,26rem)] overflow-y-auto rounded-[22px] p-2 sm:left-auto sm:right-5 sm:w-[22rem]">
                    {panel === "font" && (
                      <div>
                        <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Police
                        </p>
                        {FONTS.map((f, i) => (
                          <button
                            key={f.label}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              applyFont(i);
                              setPanel(null);
                            }}
                            className={cx(
                              "flex w-full items-center justify-between rounded-2xl px-3.5 py-2.5 text-left text-[15px] transition-colors",
                              i === fontIdx
                                ? "bg-sky-500/12 text-slate-900"
                                : "text-slate-800 hover:bg-slate-900/[0.06]",
                            )}
                          >
                            <span style={{ fontFamily: f.family }}>{f.label}</span>
                            {i === fontIdx && <Check size={15} className="text-sky-600" />}
                          </button>
                        ))}
                      </div>
                    )}

                    {panel === "size" && (
                      <div className="px-3 pb-3 pt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Taille
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySize(fontSize - 1)}
                            className="icon-btn h-9! w-9!"
                            aria-label="Diminuer"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min={8}
                            max={72}
                            value={fontSize}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => applySize(Number(e.target.value) || fontSize)}
                            className="field h-11 flex-1 py-0 text-center text-lg font-semibold tabular-nums"
                          />
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => applySize(fontSize + 1)}
                            className="icon-btn h-9! w-9!"
                            aria-label="Augmenter"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <input
                          type="range"
                          min={8}
                          max={72}
                          value={fontSize}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => applySize(Number(e.target.value))}
                          className="mt-3 w-full accent-sky-500"
                        />
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {SIZE_PRESETS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applySize(n)}
                              className={cx(
                                "rounded-full border px-2.5 py-1 text-[12px] font-semibold tabular-nums transition-colors",
                                n === fontSize
                                  ? "border-sky-500/30 bg-sky-500/10 text-sky-700"
                                  : "border-slate-900/10 bg-white/60 text-slate-600",
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Style de paragraphe
                        </p>
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {HEADINGS.map((h) => (
                            <button
                              key={h.tag}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => run("formatBlock", h.tag)}
                              className="rounded-2xl border border-slate-900/10 bg-white/60 px-2 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-white"
                            >
                              {h.label}
                            </button>
                          ))}
                        </div>
                        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Interligne
                        </p>
                        <div className="mt-2 grid grid-cols-4 gap-1.5">
                          {LINE_PRESETS.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => setLineHeight(p.value)}
                              className={cx(
                                "rounded-2xl border px-2 py-2 text-[12px] font-semibold transition-colors",
                                lineHeight === p.value
                                  ? "border-sky-500/30 bg-sky-500/10 text-sky-700"
                                  : "border-slate-900/10 bg-white/60 text-slate-600",
                              )}
                            >
                              {p.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={2.6}
                          step={0.05}
                          value={lineHeight}
                          onMouseDown={(e) => e.stopPropagation()}
                          onChange={(e) => setLineHeight(Number(e.target.value))}
                          className="mt-3 w-full accent-sky-500"
                        />
                        <p className="mt-1 text-center text-[11px] tabular-nums text-slate-400">
                          {lineHeight.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {panel === "color" && (
                      <div className="px-3 pb-3 pt-2">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          <Palette size={12} /> Texte
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {TEXT_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              title={c}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyColor(c)}
                              className="h-8 w-8 rounded-full border border-slate-900/15 shadow-sm active:scale-90"
                              style={{ background: c }}
                            />
                          ))}
                        </div>
                        <p className="mb-2 mt-4 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                          <Highlighter size={12} /> Surlignage
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {HIGHLIGHTS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyHighlight(c)}
                              className="h-8 w-8 rounded-full border border-slate-900/15 shadow-sm active:scale-90"
                              style={{
                                background:
                                  c === "transparent"
                                    ? "repeating-conic-gradient(#e2e8f0 0% 25%, #fff 0% 50%) 50% / 10px 10px"
                                    : c,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

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
            <div className="relative min-h-0 flex-1">
              {empty && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 px-5 py-3 text-slate-300 sm:px-7"
                  style={{ fontFamily, fontSize, lineHeight }}
                >
                  Commence à écrire…
                  <span className="mt-2 block text-[13px] opacity-80">
                    Ctrl + S pour enregistrer rapidement.
                  </span>
                </div>
              )}
              <div
                ref={areaRef}
                role="textbox"
                aria-multiline
                contentEditable
                suppressContentEditableWarning
                onInput={sync}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                    e.preventDefault();
                    save();
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                    e.preventDefault();
                    run("bold");
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
                    e.preventDefault();
                    run("italic");
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
                    e.preventDefault();
                    run("underline");
                  }
                }}
                onPaste={(e) => {
                  const html = e.clipboardData.getData("text/html");
                  const text = e.clipboardData.getData("text/plain");
                  if (!html && !text) return;
                  e.preventDefault();
                  if (html) {
                    const clean = html
                      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
                      .replace(/\son\w+="[^"]*"/gi, "");
                    document.execCommand("insertHTML", false, clean);
                  } else {
                    document.execCommand("insertText", false, text);
                  }
                  sync();
                }}
                className="note-body no-scrollbar h-full min-h-0 overflow-y-auto px-5 py-3 text-slate-800 sm:px-7"
                style={{
                  fontFamily,
                  fontSize,
                  lineHeight,
                  textAlign: align,
                }}
              />
            </div>
          ) : (
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-3 sm:px-7">
              {empty ? (
                <button
                  onClick={() => setMode("edit")}
                  className="mt-4 text-slate-400 transition-colors hover:text-slate-600"
                >
                  Document vide — toucher pour écrire.
                </button>
              ) : looksLikeHtml(content) ? (
                <div
                  className="note-body text-slate-800"
                  style={{ fontFamily, fontSize, lineHeight, textAlign: align }}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              ) : (
                <p
                  className="whitespace-pre-wrap text-slate-800"
                  style={{ fontFamily, fontSize, lineHeight, textAlign: align }}
                >
                  {content}
                </p>
              )}
            </div>
          )}

          <div className="flex shrink-0 items-center justify-between px-5 py-2 text-[11px] text-slate-400 sm:hidden">
            <span>
              {words} mot{words > 1 ? "s" : ""}
            </span>
            <span>{chars} car.</span>
          </div>

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
