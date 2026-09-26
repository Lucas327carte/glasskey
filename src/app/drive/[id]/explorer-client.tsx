"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FilePlus2,
  FolderInput,
  FolderOpen,
  FolderPlus,
  FolderSymlink,
  Loader2,
  Lock,
  Pencil,
  PencilLine,
  Trash2,
  Upload,
  Usb,
  X,
} from "lucide-react";
import ContextMenu, { MenuState } from "@/components/ContextMenu";
import DensityButton, { useDensity } from "@/components/DensityButton";
import GlassBackdrop from "@/components/GlassBackdrop";
import NodeIcon, { fileCategory } from "@/components/NodeIcon";
import NoteEditor from "@/components/NoteEditor";
import Sheet from "@/components/Sheet";
import { api, Crumb, FolderEntry, NodeMeta } from "@/lib/api";
import { useLongPress } from "@/lib/useLongPress";
import { useSuccessFlash } from "@/lib/useSuccess";
import { cx, fmtSize } from "@/lib/util";

type DriveInfo = { id: string; name: string; hue: number };

type SheetState =
  | { type: "newfolder" }
  | { type: "rename"; node: NodeMeta }
  | { type: "move"; node: NodeMeta }
  | { type: "delete"; node: NodeMeta }
  | { type: "bundle"; origin: NodeMeta }
  | { type: "preview"; node: NodeMeta }
  | null;

function NodeTile({
  node,
  index,
  iconSize,
  onOpen,
  onMenu,
}: {
  node: NodeMeta;
  index: number;
  iconSize: "sm" | "md" | "lg";
  onOpen: () => void;
  onMenu: (pt: { x: number; y: number }) => void;
}) {
  const lp = useLongPress(onMenu);
  const isImage = node.kind === "file" && (node.mimeType ?? "").startsWith("image/");
  const box =
    iconSize === "lg" ? "h-20 w-20" : iconSize === "sm" ? "h-14 w-14" : "h-16 w-16";

  return (
    <button
      {...lp.bind}
      onClick={(e) => {
        if (lp.shouldIgnoreClick()) {
          e.preventDefault();
          return;
        }
        onOpen();
      }}
      className="tile pop flex flex-col items-center gap-2.5"
      style={{ ["--d" as string]: `${Math.min(index, 14) * 0.045}s` }}
      aria-label={node.name}
    >
      <span className={cx("tile-box glass grid place-items-center rounded-[26px]", box)}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${node.id}`}
            alt=""
            loading="lazy"
            className="pointer-events-none h-full w-full rounded-[26px] object-cover"
          />
        ) : (
          <NodeIcon kind={node.kind} mimeType={node.mimeType} name={node.name} size={iconSize === "sm" ? "sm" : "md"} />
        )}
      </span>
      <span className="w-full px-0.5 text-center">
        <span className="block truncate text-[13px] font-medium leading-tight">{node.name}</span>
        <span className="block text-[11px] text-slate-400">
          {node.kind === "folder" ? "Dossier" : fmtSize(node.size)}
        </span>
      </span>
    </button>
  );
}

/** PDF viewer with loading state and native toolbar tuned. */
function PdfPreview({ node }: { node: NodeMeta }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white">
      {!ready && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <Loader2 size={26} className="spin-slow" />
            <p className="text-sm font-medium">Chargement du PDF…</p>
          </div>
        </div>
      )}
      <iframe
        key={node.id}
        src={`/api/files/${node.id}#toolbar=1&navpanes=0&view=FitH&zoom=page-width`}
        title={node.name}
        onLoad={() => setReady(true)}
        className="h-[60vh] w-full sm:h-[68vh]"
      />
    </div>
  );
}

const TEXTUAL_RE = /\.(txt|md|log|csv)$/i;
function isTextual(node: NodeMeta): boolean {
  return (node.mimeType ?? "").startsWith("text/") || TEXTUAL_RE.test(node.name);
}

export default function ExplorerClient({ drive }: { drive: DriveInfo }) {
  const router = useRouter();
  const success = useSuccessFlash();
  const [density, setDensity] = useDensity();

  const [path, setPath] = useState<Crumb[]>([{ id: null, name: drive.name }]);
  const [nodes, setNodes] = useState<NodeMeta[] | null>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const dragDepth = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderEntry[] | null>(null);
  const [moveTarget, setMoveTarget] = useState<string | null | undefined>(undefined);
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [note, setNote] = useState<{ node: NodeMeta | null; mode: "view" | "edit" } | null>(null);

  const currentParent = path[path.length - 1].id;

  const load = useCallback(
    async (parentId: string | null, replacePath?: Crumb[]) => {
      setNodes(null);
      try {
        const data = await api<{ parentId: string | null; path: Crumb[]; nodes: NodeMeta[] }>(
          `/api/drives/${drive.id}/nodes?parent=${parentId ?? "root"}`,
        );
        setNodes(data.nodes);
        setPath(replacePath ?? data.path);
      } catch {
        router.replace("/drives");
      }
    },
    [drive.id, router],
  );

  useEffect(() => {
    load(null);
  }, [load]);

  const refresh = useCallback(() => load(currentParent), [load, currentParent]);

  const toast = (msg: string) => {
    setBanner(msg);
    window.setTimeout(() => setBanner(null), 3800);
  };

  /* ---------- navigation ---------- */
  const openNode = (node: NodeMeta) => {
    if (node.kind === "folder") {
      load(node.id);
    } else if (isTextual(node)) {
      setNote({ node, mode: "view" });
    } else {
      setSheet({ type: "preview", node });
    }
  };

  const goBack = () => {
    if (path.length > 1) {
      const next = path.slice(0, -1);
      load(next[next.length - 1].id, next);
    } else {
      router.push("/drives");
    }
  };

  const goTo = (index: number) => {
    if (index === path.length - 1) return;
    const next = path.slice(0, index + 1);
    load(next[next.length - 1].id, next);
  };

  /* ---------- actions ---------- */
  const uploadFiles = async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.size > 0);
    if (!arr.length || busy || success.active) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("parentId", currentParent ?? "root");
      arr.forEach((f) => fd.append("files", f));
      const res = await fetch(`/api/drives/${drive.id}/upload`, { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Échec de l'import");
      success.fire();
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Échec de l'import");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const openSheet = (s: SheetState) => {
    setError(null);
    setFolders(null);
    setMoveTarget(undefined);
    if (s?.type === "rename") setName(s.node.name);
    else setName("");
    if (s?.type === "bundle") {
      setSelection(new Set([s.origin.id]));
    }
    if (s?.type === "move") {
      api<{ folders: FolderEntry[] }>(`/api/drives/${drive.id}/folders?exclude=${s.node.id}`)
        .then((d) => setFolders(d.folders))
        .catch(() => setFolders([]));
      setMoveTarget(currentParent);
    }
    setSheet(s);
  };

  const fail = (msg: string) => setError(msg);

  const createFolder = async () => {
    if (busy || success.active) return;
    if (!name.trim()) return fail("Nom de dossier invalide");
    setBusy(true);
    try {
      await api(`/api/drives/${drive.id}/nodes`, {
        body: { name: name.trim(), parentId: currentParent },
      });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const renameNode = async () => {
    if (!sheet || sheet.type !== "rename" || busy || success.active) return;
    if (!name.trim()) return fail("Nom invalide");
    setBusy(true);
    try {
      await api(`/api/nodes/${sheet.node.id}`, { method: "PATCH", body: { name: name.trim() } });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const moveNode = async () => {
    if (!sheet || sheet.type !== "move" || busy || success.active) return;
    const target = moveTarget === undefined ? currentParent : moveTarget;
    setBusy(true);
    try {
      await api(`/api/nodes/${sheet.node.id}`, { method: "PATCH", body: { parentId: target } });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const deleteNode = async () => {
    if (!sheet || sheet.type !== "delete" || busy || success.active) return;
    setBusy(true);
    try {
      await api(`/api/nodes/${sheet.node.id}`, { method: "DELETE" });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const bundle = async () => {
    if (!sheet || sheet.type !== "bundle" || busy || success.active) return;
    if (!name.trim()) return fail("Nom de dossier invalide");
    setBusy(true);
    try {
      await api(`/api/drives/${drive.id}/folder-with-items`, {
        body: { name: name.trim(), parentId: currentParent, nodeIds: [...selection] },
      });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  /* ---------- context menus ---------- */
  const menuFor = (node: NodeMeta) => (pt: { x: number; y: number }) => {
    const items =
      node.kind === "folder"
        ? [
            { icon: FolderOpen, label: "Ouvrir", onClick: () => openNode(node) },
            { icon: Pencil, label: "Renommer", onClick: () => openSheet({ type: "rename", node }) },
            { icon: FolderInput, label: "Déplacer", onClick: () => openSheet({ type: "move", node }) },
            {
              icon: Trash2,
              label: "Supprimer",
              destructive: true,
              onClick: () => openSheet({ type: "delete", node }),
            },
          ]
        : [
            ...(isTextual(node)
              ? [
                  {
                    icon: PencilLine,
                    label: "Ouvrir le document",
                    onClick: () => setNote({ node, mode: "view" }),
                  },
                ]
              : []),
            {
              icon: Download,
              label: "Télécharger",
              onClick: () => {
                const a = document.createElement("a");
                a.href = `/api/files/${node.id}?download=1`;
                a.download = node.name;
                a.click();
              },
            },
            { icon: Pencil, label: "Renommer", onClick: () => openSheet({ type: "rename", node }) },
            { icon: FolderInput, label: "Déplacer", onClick: () => openSheet({ type: "move", node }) },
            {
              icon: FolderSymlink,
              label: "Nouveau dossier avec…",
              onClick: () => openSheet({ type: "bundle", origin: node }),
            },
            {
              icon: Trash2,
              label: "Supprimer",
              destructive: true,
              onClick: () => openSheet({ type: "delete", node }),
            },
          ];
    setMenu({ x: pt.x, y: pt.y, title: node.name, items });
  };

  /* ---------- drag & drop ---------- */
  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  /* ---------- layout classes ---------- */
  const gridClass = useMemo(() => {
    if (density === "mobile") return "grid-cols-3 gap-x-3 gap-y-5";
    if (density === "desktop")
      return "grid-cols-4 gap-x-4 gap-y-7 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9";
    return "grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8";
  }, [density]);
  const iconSize: "sm" | "md" | "lg" = density === "desktop" ? "lg" : density === "mobile" ? "sm" : "md";

  const preview = sheet?.type === "preview" ? sheet.node : null;
  const previewCat = preview ? fileCategory(preview.mimeType, preview.name) : null;

  return (
    <GlassBackdrop>
      <main
        className="mx-auto min-h-dvh w-full max-w-7xl px-4 pb-20 pt-4 sm:px-6"
        onDragEnter={onDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {/* toolbar */}
        <div className="sticky top-3 z-40 mb-6">
          <div className="glass flex items-center gap-2 rounded-full py-2 pl-2 pr-2">
            <button onClick={goBack} className="icon-btn shrink-0" aria-label="Retour" title="Retour">
              <ChevronLeft size={19} />
            </button>
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pr-1">
              {path.map((crumb, i) => (
                <span key={crumb.id ?? "root"} className="flex shrink-0 items-center gap-1">
                  {i > 0 && <ChevronRight size={13} className="text-slate-300" />}
                  <button
                    onClick={() => goTo(i)}
                    className={cx(
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-semibold transition-colors",
                      i === path.length - 1 ? "bg-slate-900/[0.08] text-slate-900" : "text-slate-500 hover:text-slate-900",
                    )}
                  >
                    {i === 0 && <Usb size={13} className="text-sky-500" />}
                    <span className="max-w-32 truncate sm:max-w-48">{crumb.name}</span>
                  </button>
                </span>
              ))}
            </div>
            <button
              onClick={() => fileInput.current?.click()}
              className="icon-btn shrink-0"
              aria-label="Importer des fichiers"
              title="Importer des fichiers"
            >
              {busy ? <Loader2 size={17} className="spin-slow" /> : <Upload size={17} />}
            </button>
            <button
              onClick={() => openSheet({ type: "newfolder" })}
              className="icon-btn shrink-0"
              aria-label="Nouveau dossier"
              title="Nouveau dossier"
            >
              <FolderPlus size={17} />
            </button>
            <button
              onClick={() => setNote({ node: null, mode: "edit" })}
              className="icon-btn shrink-0"
              aria-label="Nouveau document texte"
              title="Nouveau document texte"
            >
              <FilePlus2 size={17} />
            </button>
            <DensityButton density={density} onChange={setDensity} />
            <button
              onClick={() => router.push("/drives")}
              className="icon-btn shrink-0"
              aria-label="Verrouiller la clé"
              title="Verrouiller la clé"
            >
              <Lock size={16} />
            </button>
          </div>
        </div>

        <input
          ref={fileInput}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />

        {/* content */}
        {nodes === null ? (
          <div className={cx("grid", gridClass)}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <div className="skeleton h-16 w-16 rounded-[26px]" />
                <div className="skeleton h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : nodes.length === 0 ? (
          <div className="glass rise mx-auto mt-8 flex max-w-md flex-col items-center rounded-[34px] px-8 py-14 text-center">
            <div className="floaty mb-6 grid h-24 w-24 place-items-center rounded-[30px] border-2 border-dashed border-slate-900/10 bg-slate-900/[0.03]">
              <FolderOpen size={38} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold">Dossier vide</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Importe des fichiers ou crée un dossier. Maintiens un élément
              pressé (ou clic droit) pour plus d'options.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <button onClick={() => fileInput.current?.click()} className="btn btn-primary">
                <Upload size={17} />
                Importer
              </button>
              <button onClick={() => openSheet({ type: "newfolder" })} className="btn btn-glass">
                <FolderPlus size={17} />
                Nouveau dossier
              </button>
            </div>
          </div>
        ) : (
          <div className={cx("grid", gridClass)}>
            {nodes.map((node, i) => (
              <NodeTile
                key={node.id}
                node={node}
                index={i}
                iconSize={iconSize}
                onOpen={() => openNode(node)}
                onMenu={menuFor(node)}
              />
            ))}
          </div>
        )}

        {/* toast */}
        {banner && (
          <div className="fixed left-1/2 top-5 z-[110] -translate-x-1/2">
            <div className="sheet-in glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-rose-700">
              {banner}
            </div>
          </div>
        )}

        {/* drag & drop overlay */}
        {dragOver && (
          <div className="pointer-events-none fixed inset-0 z-[105] grid place-items-center bg-slate-900/35 backdrop-blur-sm">
            <div className="sheet-in flex flex-col items-center gap-4 rounded-[36px] border-2 border-dashed border-sky-400/70 bg-sky-500/10 px-14 py-12">
              <Upload size={44} className="text-sky-600" />
              <p className="text-lg font-bold text-sky-700">Dépose pour importer ici</p>
            </div>
          </div>
        )}
      </main>

      <ContextMenu menu={menu} onClose={() => setMenu(null)} />

      {/* ---- new folder ---- */}
      <Sheet
        open={sheet?.type === "newfolder"}
        onClose={() => setSheet(null)}
        title="Nouveau dossier"
        icon={<FolderPlus size={19} className="text-sky-500" />}
      >
        <input
          className="field mb-4"
          placeholder="Nom du dossier"
          autoFocus
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createFolder()}
        />
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>{error ?? "."}</p>
        <button onClick={createFolder} disabled={busy || success.active} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="spin-slow" /> : <FolderPlus size={17} />}
          Créer le dossier
        </button>
      </Sheet>

      {/* ---- rename ---- */}
      <Sheet
        open={sheet?.type === "rename"}
        onClose={() => setSheet(null)}
        title="Renommer"
        icon={<Pencil size={18} className="text-sky-500" />}
      >
        <input
          className="field mb-4"
          value={name}
          autoFocus
          maxLength={90}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && renameNode()}
        />
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>{error ?? "."}</p>
        <button onClick={renameNode} disabled={busy || success.active} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="spin-slow" /> : <Pencil size={16} />}
          Enregistrer
        </button>
      </Sheet>

      {/* ---- move ---- */}
      <Sheet
        open={sheet?.type === "move"}
        onClose={() => setSheet(null)}
        title="Déplacer vers…"
        icon={<FolderInput size={18} className="text-violet-500" />}
      >
        <div className="no-scrollbar mb-4 max-h-64 space-y-1.5 overflow-y-auto pr-1">
          <button
            onClick={() => setMoveTarget(null)}
            className={cx(
              "flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-colors",
              moveTarget === null
                ? "border-sky-500/50 bg-sky-500/15 text-slate-900"
                : "border-slate-900/10 bg-slate-900/[0.04] text-slate-600 hover:bg-slate-900/[0.06]",
            )}
          >
            <Usb size={16} className="text-sky-500" />
            Racine de la clé
            {moveTarget === null && <Check size={16} className="ml-auto text-sky-500" />}
          </button>
          {folders === null ? (
            <div className="skeleton h-12 rounded-2xl" />
          ) : (
            folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setMoveTarget(f.id)}
                className={cx(
                  "flex w-full items-center gap-2 rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-colors",
                  moveTarget === f.id
                    ? "border-sky-500/50 bg-sky-500/15 text-slate-900"
                    : "border-slate-900/10 bg-slate-900/[0.04] text-slate-600 hover:bg-slate-900/[0.06]",
                )}
                style={{ paddingLeft: `${14 + Math.min(f.depth, 6) * 16}px` }}
              >
                <NodeIcon kind="folder" mimeType={null} name={f.name} size="sm" />
                <span className="truncate">{f.label}</span>
                {moveTarget === f.id && <Check size={16} className="ml-auto shrink-0 text-sky-500" />}
              </button>
            ))
          )}
        </div>
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>{error ?? "."}</p>
        <button
          onClick={moveNode}
          disabled={busy || success.active || moveTarget === undefined}
          className="btn btn-primary w-full"
        >
          {busy ? <Loader2 size={18} className="spin-slow" /> : <FolderInput size={17} />}
          Déplacer ici
        </button>
      </Sheet>

      {/* ---- delete ---- */}
      <Sheet
        open={sheet?.type === "delete"}
        onClose={() => setSheet(null)}
        title="Supprimer ?"
        icon={<Trash2 size={18} className="text-rose-600" />}
      >
        <p className="mb-5 text-sm leading-relaxed text-slate-600">
          « {sheet?.type === "delete" ? sheet.node.name : ""} »
          {sheet?.type === "delete" && sheet.node.kind === "folder"
            ? " et tout son contenu seront définitivement supprimés."
            : " sera définitivement supprimé."}
        </p>
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>{error ?? "."}</p>
        <div className="flex gap-2.5">
          <button onClick={() => setSheet(null)} className="btn btn-glass flex-1">
            Annuler
          </button>
          <button onClick={deleteNode} disabled={busy || success.active} className="btn btn-danger flex-1">
            {busy ? <Loader2 size={18} className="spin-slow" /> : <Trash2 size={16} />}
            Supprimer
          </button>
        </div>
      </Sheet>

      {/* ---- create folder with items ---- */}
      <Sheet
        open={sheet?.type === "bundle"}
        onClose={() => setSheet(null)}
        title="Créer un dossier et mettre dedans"
        icon={<FolderSymlink size={18} className="text-emerald-600" />}
        wide
      >
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Nom du dossier
        </label>
        <input
          className="field mb-4"
          placeholder="Nom du dossier"
          autoFocus
          value={name}
          maxLength={60}
          onChange={(e) => setName(e.target.value)}
        />
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Fichiers à mettre dedans · {selection.size} sélectionné{selection.size > 1 ? "s" : ""}
        </label>
        <div className="no-scrollbar mb-4 max-h-56 space-y-1.5 overflow-y-auto pr-1">
          {(nodes ?? [])
            .filter((n) => sheet?.type === "bundle" && n.id !== sheet.origin.id)
            .map((n) => {
              const on = selection.has(n.id);
              return (
                <button
                  key={n.id}
                  onClick={() =>
                    setSelection((prev) => {
                      const next = new Set(prev);
                      if (next.has(n.id)) next.delete(n.id);
                      else next.add(n.id);
                      return next;
                    })
                  }
                  className={cx(
                    "flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-colors",
                    on
                      ? "border-emerald-500/50 bg-emerald-500/15"
                      : "border-slate-900/10 bg-slate-900/[0.04] hover:bg-slate-900/[0.06]",
                  )}
                >
                  <NodeIcon kind={n.kind} mimeType={n.mimeType} name={n.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.name}</span>
                    <span className="text-[11px] text-slate-400">
                      {n.kind === "folder" ? "Dossier" : fmtSize(n.size)}
                    </span>
                  </span>
                  <span
                    className={cx(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all",
                      on ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-900/15 text-transparent",
                    )}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              );
            })}
          {(nodes ?? []).filter((n) => sheet?.type === "bundle" && n.id !== sheet.origin.id).length === 0 && (
            <p className="py-3 text-center text-sm text-slate-400">
              Aucun autre élément ici — le dossier contiendra juste «{" "}
              {sheet?.type === "bundle" ? sheet.origin.name : ""} ».
            </p>
          )}
        </div>
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>{error ?? "."}</p>
        {/* save button is always available, even with no selection */}
        <button onClick={bundle} disabled={busy || success.active} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="spin-slow" /> : <FolderSymlink size={17} />}
          Sauvegarder
        </button>
      </Sheet>

      {/* ---- preview ---- */}
      <Sheet open={!!preview} onClose={() => setSheet(null)} wide>
        {preview && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <NodeIcon kind="file" mimeType={preview.mimeType} name={preview.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{preview.name}</p>
                <p className="text-xs text-slate-400">{fmtSize(preview.size)}</p>
              </div>
              <button onClick={() => setSheet(null)} className="icon-btn h-9! w-9!" aria-label="Fermer">
                <X size={17} />
              </button>
            </div>

            {previewCat === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${preview.id}`}
                alt={preview.name}
                className="no-scrollbar max-h-[62vh] w-full rounded-3xl border border-slate-900/10 object-contain"
              />
            ) : previewCat === "pdf" ? (
              <PdfPreview node={preview} />
            ) : previewCat === "video" ? (
              <video
                src={`/api/files/${preview.id}`}
                controls
                className="max-h-[62vh] w-full rounded-3xl border border-slate-900/10 bg-black"
              />
            ) : previewCat === "audio" ? (
              <div className="glass grid place-items-center gap-5 rounded-3xl px-6 py-10">
                <NodeIcon kind="file" mimeType={preview.mimeType} name={preview.name} size="lg" />
                <audio src={`/api/files/${preview.id}`} controls className="w-full" />
              </div>
            ) : (
              <div className="glass grid place-items-center gap-4 rounded-3xl px-6 py-10 text-center">
                <NodeIcon kind="file" mimeType={preview.mimeType} name={preview.name} size="lg" />
                <p className="text-sm text-slate-500">
                  Aperçu indisponible pour ce type de fichier — télécharge-le pour l'ouvrir.
                </p>
              </div>
            )}

            <div className="flex gap-2.5">
              <a
                href={`/api/files/${preview.id}?download=1`}
                download={preview.name}
                className="btn btn-primary flex-1"
              >
                <Download size={17} />
                Télécharger
              </a>
              <a
                href={`/api/files/${preview.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-glass"
                aria-label="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink size={17} />
              </a>
            </div>
          </div>
        )}
      </Sheet>

      {note && (
        <NoteEditor
          driveId={drive.id}
          parentId={currentParent}
          node={note.node}
          initialMode={note.mode}
          onClose={() => setNote(null)}
          onSaved={() => {
            success.fire();
            refresh();
          }}
        />
      )}

      {success.element}
    </GlassBackdrop>
  );
}
