import { UserRound } from "lucide-react";
import { getDashboardData } from "@/services/dashboard";
import NotificationBell from "@/components/layout/NotificationBell";
import MassHero from "@/components/dashboard/MassHero";
import QuickTiles from "@/components/dashboard/QuickTiles";
import SongCatalogCard from "@/components/dashboard/SongCatalogCard";
import RehearsalCard from "@/components/dashboard/RehearsalCard";
import ChoirLifeBanner from "@/components/dashboard/ChoirLifeBanner";
import QuoteBanner from "@/components/dashboard/QuoteBanner";
import { greeting, todayLabel } from "@/components/dashboard/format";
import { cardShadow } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  choirId: string;
  firstName: string | null;
  choirName: string | null;
};

/**
 * Accueil commun à tous les rôles (maquette V2).
 * Toutes les données passent par getDashboardData().
 */
export default async function AccueilDashboard(ctx: Props) {
  const data = await getDashboardData(ctx);

  return (
    // Fond `canvas` sur toute la largeur : les cartes blanches ressortent
    <div className="min-h-full bg-canvas">
      <div className="mx-auto flex w-full max-w-[1200px] min-w-0 flex-col gap-4 overflow-x-clip px-4 pb-10 pt-5 text-ink md:gap-7 md:px-8 md:pt-7">

        {/* ── Salutation + annonces / profil ── */}
        <header className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-muted md:text-[13px]">{todayLabel()}</p>
            <p className="mt-0.5 truncate font-display text-xl font-extrabold tracking-tight md:text-2xl">
              {greeting()}{data.firstName ? `, ${data.firstName}` : ""}
              {data.choirName && <span className="hidden font-medium text-ink-muted sm:inline"> — {data.choirName}</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <NotificationBell variant="large" />
            {/* Page profil pas encore développée : à transformer en <Link href="/profil"> */}
            <span
              role="img"
              aria-label="Mon profil (bientôt disponible)"
              title="Mon profil — bientôt disponible"
              className={cn("flex h-11 w-11 cursor-default items-center justify-center rounded-full border border-line bg-white text-navy", cardShadow)}
            >
              <UserRound className="h-5 w-5" strokeWidth={2.2} aria-hidden />
            </span>
          </div>
        </header>

        {/* ── Prochaine messe ── */}
        <MassHero mass={data.nextMass} />

        {/* ── Présences / Contributions / Pupitre ── */}
        <QuickTiles />

        {/* ── Catalogue + prochaine répétition ── */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7"><SongCatalogCard data={data.songs} /></div>
          <div className="min-w-0 lg:col-span-5"><RehearsalCard data={data.nextRehearsal} /></div>
        </div>

        {/* ── Vie chorale ── */}
        <ChoirLifeBanner data={data.choirLife} />

        {/* ── Citation ── */}
        <QuoteBanner />
      </div>
    </div>
  );
}
