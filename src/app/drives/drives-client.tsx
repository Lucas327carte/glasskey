"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Usb,
} from "lucide-react";
import ContextMenu, { MenuState } from "@/components/ContextMenu";
import DensityButton, { useDensity } from "@/components/DensityButton";
import GlassBackdrop from "@/components/GlassBackdrop";
import PinField from "@/components/PinField";
import Sheet from "@/components/Sheet";
import { api, DriveMeta } from "@/lib/api";
import { useLongPress } from "@/lib/useLongPress";
import { useSuccessFlash } from "@/lib/useSuccess";
import { cx, DRIVE_CODE_RE, firstName, fmtSize } from "@/lib/util";

type SheetState =
  | { type: "create" }
  | { type: "unlock"; drive: DriveMeta }
  | { type: "rename"; drive: DriveMeta }
  | { type: "delete"; drive: DriveMeta }
  | null;

const CAPACITY = 512 * 1024 * 1024; // barre décorative : 512 Mo virtuels

function DriveTile({
  drive,
  onOpen,
  onMenu,
  index,
}: {
  drive: DriveMeta;
  onOpen: () => void;
  onMenu: (pt: { x: number; y: number }) => void;
  index: number;
}) {
  const lp = useLongPress(onMenu);
  const pct = Math.max(4, Math.min(100, (drive.usedBytes / CAPACITY) * 100));

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
      className="tile rise flex flex-col items-stretch gap-3 text-left"
      style={{ ["--d" as string]: `${Math.min(index, 10) * 0.06}s` }}
      aria-label={`Clé ${drive.name}`}
    >
      <div className="tile-box glass relative aspect-square w-full overflow-hidden rounded-[30px] p-4">
        <div
          className="absolute -inset-12 opacity-60 blur-2xl"
          style={{
            background: `radial-gradient(circle at 30% 25%, hsl(${drive.hue} 85% 62% / 0.5), transparent 60%)`,
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between">
          <div
            className="grid h-14 w-14 place-items-center rounded-[20px] border border-slate-900/15 shadow-[0_10px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]"
            style={{
              background: `linear-gradient(150deg, hsl(${drive.hue} 90% 68% / 0.95), hsl(${drive.hue + 40} 85% 55% / 0.95))`,
            }}
          >
            <Usb size={26} className="text-white drop-shadow" />
          </div>
          <div>
            <div className="mb-1.5 h-1.5 overflow-hidden rounded-full bg-slate-900/[0.08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-fuchsia-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-slate-500">
              {fmtSize(drive.usedBytes)} utilisés
            </p>
          </div>
        </div>
      </div>
      <div className="px-1">
        <p className="truncate text-[15px] font-semibold leading-tight">{drive.name}</p>
        <p className="text-xs text-slate-400">
          {drive.itemCount} élément{drive.itemCount > 1 ? "s" : ""}
        </p>
      </div>
    </button>
  );
}

export default function DrivesClient({ username }: { username: string }) {
  const router = useRouter();
  const success = useSuccessFlash();
  const [density, setDensity] = useDensity();
  const [drives, setDrives] = useState<DriveMeta[] | null>(null);
  const [menu, setMenu] = useState<MenuState>(null);
  const [sheet, setSheet] = useState<SheetState>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const nameRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ drives: DriveMeta[] }>("/api/drives");
      setDrives(data.drives);
    } catch {
      router.replace("/auth");
    }
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const openSheet = (s: SheetState) => {
    setError(null);
    setCode("");
    setName(s && "drive" in s ? s.drive.name : "");
    setSheet(s);
    if (s?.type === "create" || s?.type === "rename") {
      window.setTimeout(() => nameRef.current?.focus(), 120);
    }
  };

  const fail = (msg: string) => {
    setError(msg);
    setShakeKey((k) => k + 1);
    setCode("");
  };

  const createDrive = async () => {
    if (busy || success.active) return;
    if (!name.trim()) return fail("Donne un nom à ta clé");
    if (!DRIVE_CODE_RE.test(code)) return fail("Le code doit contenir 2 à 4 chiffres");
    setBusy(true);
    try {
      await api("/api/drives", { body: { name: name.trim(), code } });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const unlockDrive = async () => {
    if (!sheet || sheet.type !== "unlock" || busy || success.active) return;
    if (!DRIVE_CODE_RE.test(code)) return fail("Code : 2 à 4 chiffres");
    setBusy(true);
    try {
      await api(`/api/drives/${sheet.drive.id}/unlock`, { body: { code } });
      const target = `/drive/${sheet.drive.id}`;
      setSheet(null);
      success.fire(() => router.push(target));
    } catch (e) {
      fail(e instanceof Error ? e.message : "Code incorrect");
    } finally {
      setBusy(false);
    }
  };

  const renameDrive = async () => {
    if (!sheet || sheet.type !== "rename" || busy || success.active) return;
    if (!name.trim()) return fail("Nom invalide");
    setBusy(true);
    try {
      await api(`/api/drives/${sheet.drive.id}`, { method: "PATCH", body: { name: name.trim() } });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const deleteDrive = async () => {
    if (!sheet || sheet.type !== "delete" || busy || success.active) return;
    setBusy(true);
    try {
      await api(`/api/drives/${sheet.drive.id}`, { method: "DELETE" });
      setSheet(null);
      success.fire();
      await refresh();
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/auth");
  };

  const gridClass =
    density === "mobile"
      ? "grid-cols-2"
      : density === "desktop"
        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5";

  const openMenuFor = (drive: DriveMeta) => (pt: { x: number; y: number }) =>
    setMenu({
      x: pt.x,
      y: pt.y,
      title: drive.name,
      items: [
        { icon: Pencil, label: "Renommer", onClick: () => openSheet({ type: "rename", drive }) },
        {
          icon: Trash2,
          label: "Supprimer",
          destructive: true,
          onClick: () => openSheet({ type: "delete", drive }),
        },
      ],
    });

  return (
    <GlassBackdrop>
      <main className="mx-auto min-h-dvh w-full max-w-6xl px-5 pb-16 pt-7 sm:px-8">
        {/* header */}
        <header className="rise mb-8 flex items-center gap-3">
          <div className="glass grid h-12 w-12 shrink-0 place-items-center rounded-[18px]">
            <Usb size={22} className="text-sky-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-500">Bonjour {firstName(username)},</p>
            <h1 className="truncate text-2xl font-bold tracking-tight">Mes clés virtuelles</h1>
          </div>
          <DensityButton density={density} onChange={setDensity} />
          <button onClick={logout} className="icon-btn" aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut size={17} />
          </button>
        </header>

        {/* content */}
        {drives === null ? (
          <div className={cx("grid gap-4 sm:gap-5", gridClass)}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton aspect-square rounded-[30px]" />
            ))}
          </div>
        ) : drives.length === 0 ? (
          <div className="glass rise mx-auto mt-6 flex max-w-md flex-col items-center rounded-[34px] px-8 py-14 text-center">
            <div className="floaty mb-6 grid h-24 w-24 place-items-center rounded-[30px] border-2 border-dashed border-slate-900/10 bg-slate-900/[0.03]">
              <Usb size={40} className="text-slate-400" />
            </div>
            <h2 className="text-xl font-bold">Aucune clé pour l'instant</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Crée ta première clé USB virtuelle : un nom, un code à 2-4 chiffres,
              et elle te suit partout.
            </p>
            <button onClick={() => openSheet({ type: "create" })} className="btn btn-primary mt-7">
              <Plus size={18} strokeWidth={2.6} />
              Créer une clé USB
            </button>
          </div>
        ) : (
          <div className={cx("grid gap-4 sm:gap-5", gridClass)}>
            {drives.map((drive, i) => (
              <DriveTile
                key={drive.id}
                drive={drive}
                index={i}
                onOpen={() => openSheet({ type: "unlock", drive })}
                onMenu={openMenuFor(drive)}
              />
            ))}
            {/* new key tile */}
            <button
              onClick={() => openSheet({ type: "create" })}
              className="tile rise group"
              style={{ ["--d" as string]: `${Math.min(drives.length, 10) * 0.06}s` }}
              aria-label="Nouvelle clé"
            >
              <div className="grid aspect-square w-full place-items-center rounded-[30px] border-2 border-dashed border-slate-900/10 bg-slate-900/[0.03] transition-colors group-hover:border-white/35 group-hover:bg-slate-900/[0.04]">
                <div className="flex flex-col items-center gap-2 text-slate-600 transition-colors group-hover:text-slate-900">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-slate-900/10 bg-slate-900/[0.06]">
                    <Plus size={26} strokeWidth={2.4} />
                  </span>
                  <span className="text-sm font-semibold">Nouvelle clé</span>
                </div>
              </div>
            </button>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Astuce : maintiens le doigt (ou clic droit) sur une clé pour la renommer ou la supprimer.
        </p>
      </main>

      <ContextMenu menu={menu} onClose={() => setMenu(null)} />

      {/* ---- create ---- */}
      <Sheet
        open={sheet?.type === "create"}
        onClose={() => setSheet(null)}
        title="Nouvelle clé USB"
        icon={<Usb size={19} className="text-sky-500" />}
      >
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Nom de la clé
        </label>
        <input
          ref={nameRef}
          className="field mb-4"
          placeholder="ex. Cours, Photos, Projets…"
          value={name}
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createDrive()}
        />
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Code d'accès · 2 à 4 chiffres
        </label>
        <PinField value={code} onChange={setCode} maxLength={4} shakeKey={shakeKey} onSubmit={createDrive} />
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Chaque clé doit avoir un code différent.
        </p>
        <p className={cx("mt-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>
          {error ?? "."}
        </p>
        <button onClick={createDrive} disabled={busy || success.active} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="spin-slow" /> : <Plus size={18} strokeWidth={2.6} />}
          Créer la clé
        </button>
      </Sheet>

      {/* ---- unlock ---- */}
      <Sheet
        open={sheet?.type === "unlock"}
        onClose={() => setSheet(null)}
        title={sheet?.type === "unlock" ? sheet.drive.name : ""}
        icon={<KeyRound size={19} className="text-amber-500" />}
      >
        <p className="-mt-1 mb-4 text-sm text-slate-500">
          Entre le code de cette clé pour l'ouvrir.
        </p>
        <PinField
          value={code}
          onChange={setCode}
          maxLength={4}
          shakeKey={shakeKey}
          autoFocus
          onSubmit={unlockDrive}
        />
        <p className={cx("mt-3 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>
          {error ?? "."}
        </p>
        <button onClick={unlockDrive} disabled={busy || success.active} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="spin-slow" /> : <KeyRound size={17} />}
          Déverrouiller
        </button>
      </Sheet>

      {/* ---- rename ---- */}
      <Sheet
        open={sheet?.type === "rename"}
        onClose={() => setSheet(null)}
        title="Renommer la clé"
        icon={<Pencil size={18} className="text-sky-500" />}
      >
        <input
          ref={nameRef}
          className="field mb-4"
          value={name}
          maxLength={32}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && renameDrive()}
        />
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>
          {error ?? "."}
        </p>
        <button onClick={renameDrive} disabled={busy || success.active} className="btn btn-primary w-full">
          {busy ? <Loader2 size={18} className="spin-slow" /> : <Pencil size={16} />}
          Enregistrer
        </button>
      </Sheet>

      {/* ---- delete ---- */}
      <Sheet
        open={sheet?.type === "delete"}
        onClose={() => setSheet(null)}
        title="Supprimer cette clé ?"
        icon={<Trash2 size={18} className="text-rose-600" />}
      >
        <p className="mb-5 text-sm leading-relaxed text-slate-600">
          « {sheet?.type === "delete" ? sheet.drive.name : ""} » et tout son contenu
          (dossiers, fichiers) seront définitivement supprimés.
        </p>
        <p className={cx("mb-2 min-h-5 text-sm", error ? "text-rose-600" : "text-transparent")}>
          {error ?? "."}
        </p>
        <div className="flex gap-2.5">
          <button onClick={() => setSheet(null)} className="btn btn-glass flex-1">
            Annuler
          </button>
          <button onClick={deleteDrive} disabled={busy || success.active} className="btn btn-danger flex-1">
            {busy ? <Loader2 size={18} className="spin-slow" /> : <Trash2 size={16} />}
            Supprimer
          </button>
        </div>
      </Sheet>

      {success.element}
    </GlassBackdrop>
  );
}
