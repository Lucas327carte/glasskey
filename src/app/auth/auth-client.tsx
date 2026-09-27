"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronLeft, Loader2, LogIn, UserPlus, Usb } from "lucide-react";
import GlassBackdrop from "@/components/GlassBackdrop";
import PinField from "@/components/PinField";
import { api } from "@/lib/api";
import { useSuccessFlash } from "@/lib/useSuccess";
import { cx, PIN_RE } from "@/lib/util";

type Mode = "login" | "signup";

export default function AuthClient({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const success = useSuccessFlash();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const fail = (msg: string) => {
    setError(msg);
    setShakeKey((k) => k + 1);
    setPin("");
  };

  const submit = async () => {
    if (busy || success.active) return;
    setError(null);
    if (!/^[a-z0-9._-]{3,24}$/i.test(username.trim())) {
      fail("Nom d'utilisateur invalide (3-24 : lettres, chiffres, . _ -)");
      return;
    }
    if (!PIN_RE.test(pin)) {
      fail("Le mot de passe doit contenir 4 à 6 chiffres");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, {
        body: { username: username.trim().toLowerCase(), pin },
      });
      success.fire(() => router.replace("/home"));
    } catch (e) {
      fail(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPin("");
  };

  return (
    <GlassBackdrop>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
        <Link
          href="/"
          className="rise mb-8 inline-flex w-fit items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
          style={{ ["--d" as string]: "0.02s" }}
        >
          <ChevronLeft size={16} />
          Accueil
        </Link>

        <div className="rise mb-8 flex items-center gap-3.5" style={{ ["--d" as string]: "0.06s" }}>
          <div className="glass grid h-14 w-14 place-items-center rounded-[20px]">
            <Usb size={26} className="text-sky-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "signup" ? "Crée ton compte" : "Bon retour"}
            </h1>
            <p className="text-sm text-slate-500">
              {mode === "signup"
                ? "Un nom, un code à 4-6 chiffres, c'est parti."
                : "Connecte-toi pour retrouver tes clés."}
            </p>
          </div>
        </div>

        <div className="glass rise rounded-[30px] p-6 sm:p-7" style={{ ["--d" as string]: "0.12s" }}>
          {/* segmented toggle */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-2xl border border-slate-900/10 bg-slate-900/[0.06] p-1">
            {(
              [
                { m: "login" as Mode, label: "Connexion", Icon: LogIn },
                { m: "signup" as Mode, label: "Inscription", Icon: UserPlus },
              ]
            ).map(({ m, label, Icon }) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={cx(
                  "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-300",
                  mode === m
                    ? "bg-slate-900/[0.08] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Nom d'utilisateur
          </label>
          <input
            className="field mb-5"
            placeholder="ex. prenom.nom"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />

          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            Mot de passe{mode === "signup" ? " · 4 à 6 chiffres" : ""}
          </label>
          <PinField
            value={pin}
            onChange={setPin}
            maxLength={6}
            shakeKey={shakeKey}
            onSubmit={submit}
          />

          <p className={cx("mt-4 min-h-5 text-sm transition-opacity", error ? "text-rose-600" : "text-transparent")}>
            {error ?? "."}
          </p>
          {error?.includes("Aucun compte") && mode === "login" && (
            <button
              onClick={() => switchMode("signup")}
              className="-mt-1 mb-2 w-full rounded-2xl border border-sky-500/40 bg-sky-500/10 py-2.5 text-sm font-semibold text-sky-600 transition-colors hover:bg-sky-500/20"
            >
              Créer ce compte maintenant
            </button>
          )}

          <button
            onClick={submit}
            disabled={busy || success.active}
            className="btn btn-primary mt-2 w-full text-base"
          >
            {busy ? (
              <Loader2 size={18} className="spin-slow" />
            ) : (
              <ArrowRight size={18} strokeWidth={2.5} />
            )}
            {mode === "signup" ? "Valider l'inscription" : "Valider"}
          </button>
        </div>

        <p className="rise mt-6 text-center text-xs text-slate-400" style={{ ["--d" as string]: "0.2s" }}>
          Tes clés te suivent sur tous tes appareils, téléphone comme PC.
        </p>
      </main>
      {success.element}
    </GlassBackdrop>
  );
}
