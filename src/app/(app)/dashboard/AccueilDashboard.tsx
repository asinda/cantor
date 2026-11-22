import { getDashboardData } from "@/services/dashboard";
import MassHero from "@/components/dashboard/MassHero";
import AnnouncementsCard from "@/components/dashboard/AnnouncementsCard";
import AttendanceCard from "@/components/dashboard/AttendanceCard";
import ContributionCard from "@/components/dashboard/ContributionCard";
import SongCatalogCard from "@/components/dashboard/SongCatalogCard";
import RehearsalCard from "@/components/dashboard/RehearsalCard";
import ChoirLifeBanner from "@/components/dashboard/ChoirLifeBanner";
import QuoteBanner from "@/components/dashboard/QuoteBanner";
import { greeting, todayLabel } from "@/components/dashboard/format";
import { btn } from "@/components/dashboard/ui";
import Link from "next/link";
import { BookOpen, CalendarDays, Plus } from "lucide-react";

type Props = {
  userId: string;
  choirId: string;
  firstName: string | null;
  choirName: string | null;
  isChef: boolean;
};

/** Raccourcis de création (repris de l'ancien accueil chef) */
const CHEF_ACTIONS = [
  { href: "/chants/nouveau",      label: "Chant",      icon: Plus },
  { href: "/messe/nouveau",       label: "Feuille",    icon: BookOpen },
  { href: "/repetitions/nouveau", label: "Répétition", icon: CalendarDays },
];

/**
 * Accueil commun à tous les rôles (maquette V1).
 * Le chef a en plus des raccourcis de création dans l'en-tête.
 * Toutes les données passent par getDashboardData().
 */
export default async function AccueilDashboard({ isChef, ...ctx }: Props) {
  const data = await getDashboardData(ctx);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] min-w-0 overflow-x-clip flex-col gap-6 px-4 pb-10 pt-5 text-ink md:px-8 md:pt-7">

      {/* ── Salutation (+ raccourcis chef) ── */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-ink-muted">{todayLabel()}</p>
          <p className="mt-0.5 font-display text-2xl font-bold">
            {greeting()}{data.firstName ? `, ${data.firstName}` : ""}
            {data.choirName && <span className="font-medium text-ink-muted"> — {data.choirName}</span>}
          </p>
        </div>

        {isChef && (
          <nav aria-label="Créer" className="flex flex-wrap gap-2">
            {CHEF_ACTIONS.map(({ href, label, icon: Icon }, i) => (
              <Link key={href} href={href} className={i === 0 ? btn.primary : btn.secondary}>
                <Icon className="h-4 w-4" aria-hidden /> {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      {/* ── Prochaine messe ── */}
      <MassHero mass={data.nextMass} />

      {/* ── 3 cartes clés : défilement horizontal sur mobile, grille sur desktop ── */}
      <div
        role="region"
        aria-label="Annonces, présences et contribution"
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 [&>*]:w-[290px] [&>*]:shrink-0 [&>*]:snap-start md:[&>*]:w-auto"
      >
        <AnnouncementsCard data={data.announcements} />
        <AttendanceCard data={data.attendance} />
        <ContributionCard data={data.contribution} />
      </div>

      {/* ── Catalogue + prochaine répétition ── */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7"><SongCatalogCard data={data.songs} /></div>
        <div className="min-w-0 lg:col-span-5 [&>section]:h-full"><RehearsalCard data={data.nextRehearsal} /></div>
      </div>

      {/* ── Vie chorale ── */}
      <ChoirLifeBanner data={data.choirLife} />

      {/* ── Citation ── */}
      <QuoteBanner />
    </div>
  );
}
