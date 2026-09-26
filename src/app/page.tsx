import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  Lock,
  MonitorSmartphone,
  Usb,
} from "lucide-react";
import GlassBackdrop from "@/components/GlassBackdrop";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/drives");

  return (
    <GlassBackdrop>
      <main className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center overflow-hidden px-6 py-16">
        {/* floating decorations */}
        <div className="pointer-events-none absolute left-[6%] top-[18%] hidden opacity-70 sm:block" aria-hidden>
          <div className="glass floaty grid h-20 w-20 place-items-center rounded-[24px]" style={{ ["--r" as string]: "-8deg" }}>
            <FolderOpen className="text-sky-500" size={30} />
          </div>
        </div>
        <div className="pointer-events-none absolute right-[8%] top-[26%] hidden opacity-60 sm:block" aria-hidden>
          <div className="glass floaty grid h-16 w-16 place-items-center rounded-[20px]" style={{ ["--r" as string]: "10deg", animationDelay: "-2s" }}>
            <ImageIcon className="text-fuchsia-500" size={24} />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-[20%] left-[12%] hidden opacity-50 sm:block" aria-hidden>
          <div className="glass floaty grid h-14 w-14 place-items-center rounded-[18px]" style={{ ["--r" as string]: "6deg", animationDelay: "-4s" }}>
            <Lock className="text-violet-500" size={20} />
          </div>
        </div>

        <p className="rise mb-8 rounded-full border border-slate-900/10 bg-slate-900/[0.03] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500" style={{ ["--d" as string]: "0.05s" }}>
          GlassKey · Clés USB virtuelles
        </p>

        {/* frosted orb */}
        <div className="rise relative mb-10" style={{ ["--d" as string]: "0.15s" }}>
          <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(125,175,255,0.28),transparent_65%)] blur-2xl" aria-hidden />
          <div className="glass glass-frosted glass-hairline floaty relative grid h-40 w-40 place-items-center rounded-[42px] sm:h-48 sm:w-48">
            <div className="absolute inset-x-8 top-4 h-8 rounded-full bg-slate-900/[0.08] blur-md" aria-hidden />
            <Usb size={76} strokeWidth={1.5} className="text-slate-900 drop-shadow-[0_6px_20px_rgba(147,197,253,0.55)]" />
          </div>
        </div>

        <h1 className="rise text-balance text-center text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl" style={{ ["--d" as string]: "0.25s" }}>
          Ta clé USB,
          <br />
          <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-transparent">
            partout avec toi.
          </span>
        </h1>

        <p className="rise mt-5 max-w-md text-center text-base leading-relaxed text-slate-600 sm:text-lg" style={{ ["--d" as string]: "0.35s" }}>
          Crée des clés virtuelles protégées par code, ranges-y dossiers, images et PDF,
          et retrouve-les depuis ton téléphone ou les PC du collège.
        </p>

        <div className="rise mt-10 flex flex-col items-center gap-3 sm:flex-row" style={{ ["--d" as string]: "0.45s" }}>
          <Link href="/auth?mode=signup" className="btn btn-primary text-base">
            Créer un compte
            <ArrowRight size={18} strokeWidth={2.4} />
          </Link>
          <Link href="/auth" className="btn btn-glass text-base">
            Se connecter
          </Link>
        </div>

        <div className="rise mt-14 flex flex-wrap items-center justify-center gap-2.5" style={{ ["--d" as string]: "0.55s" }}>
          {[
            { Icon: Lock, label: "Un code par clé" },
            { Icon: HardDrive, label: "Clés illimitées" },
            { Icon: MonitorSmartphone, label: "Mobile & PC" },
          ].map(({ Icon, label }) => (
            <span key={label} className="glass flex items-center gap-2 rounded-full px-4 py-2 text-sm text-slate-600">
              <Icon size={15} className="text-sky-500" />
              {label}
            </span>
          ))}
        </div>
      </main>
    </GlassBackdrop>
  );
}
