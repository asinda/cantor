import Link from "next/link";
import {
  ArrowRight, Bell, BookOpen, Calendar, CalendarCheck, Music, PartyPopper, Plus, UserCheck, UserX,
} from "lucide-react";
import { getNextMassSheet } from "@/services/messe";
import { getNextRehearsal } from "@/services/repetitions";
import { getFeaturedSong } from "@/services/songs";
import { listNotifications, countUnreadNotifications } from "@/services/notifications";
import { LITURGICAL_GRADIENTS } from "@/types";

type Props = {
  userId: string;
  choirId: string;
  firstName: string | null;
  choirName: string | null;
};

/** Date du jour à Paris au format YYYY-MM-DD (les colonnes `date` sont des DATE sans fuseau). */
function todayParis() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/** Formate une colonne DATE ("2026-10-18") sans décalage de fuseau. */
function formatDay(date: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-3)" }}>
      {children}
    </h2>
  );
}

function SoonBadge() {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
      style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
      Bientôt
    </span>
  );
}

function NotifWrapper({ href, children }: { href: string | null; children: React.ReactNode }) {
  const cls = "card flex items-start gap-3";
  const style = { padding: "1rem" };
  return href
    ? <Link href={href} className={cls} style={style}>{children}</Link>
    : <div className={cls} style={style}>{children}</div>;
}

export default async function ChoristeDashboard({ userId, choirId, firstName, choirName }: Props) {
  const today = todayParis();

  const [messeRes, rehearsalRes, songRes, notifRes, unread] = await Promise.all([
    getNextMassSheet(choirId, today),
    getNextRehearsal(choirId, today),
    getFeaturedSong(choirId),
    listNotifications(userId, 1),
    countUnreadNotifications(userId),
  ]);

  const nextMesse     = messeRes.data;
  const nextRehearsal = rehearsalRes.data;
  const featured      = songRes.data;
  const lastNotif     = notifRes.data?.[0] ?? null;
  const unreadCount   = unread.count ?? 0;

  const rehearsalIsToday = nextRehearsal?.date === today;
  const songGrad = (LITURGICAL_GRADIENTS as Record<string, string>)[featured?.liturgical_type ?? ""]
    ?? "linear-gradient(135deg,#4A3020,#6B5030)";

  return (
    <div className="px-5 pt-5 pb-8 max-w-6xl mx-auto fade-in">

      {/* ══ HEADER ══ */}
      <div className="mb-5">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
          Accueil{firstName ? `, ${firstName}` : ""}
        </h1>
        {choirName && <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>{choirName}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ══ COLONNE PRINCIPALE ══ */}
        <div className="lg:col-span-2 space-y-5">

          {/* ── Prochaine messe ── */}
          <section>
            <SectionTitle>Prochaine messe</SectionTitle>
            <div className="card grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
              <div className="flex flex-col justify-between gap-6 min-h-[150px]">
                {nextMesse ? (
                  <div>
                    <p className="text-2xl font-black first-letter:uppercase" style={{ color: "var(--text-1)" }}>
                      {nextMesse.date && formatDay(nextMesse.date, { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                    <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>{nextMesse.title}</p>
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucune messe programmée pour le moment.</p>
                )}
                {nextMesse && (
                  <Link href={`/messe/${nextMesse.id}`} className="btn btn-secondary btn-sm self-start">
                    Voir détail
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                <Link href={nextMesse ? `/messe/${nextMesse.id}` : "/messe"}
                  className="rounded-xl p-3 flex flex-col justify-between gap-3"
                  style={{ background: "linear-gradient(135deg,#1E3D2C,#4A7C59)", color: "white" }}>
                  <BookOpen className="w-4 h-4" strokeWidth={2} />
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold leading-tight">Feuille de messe</span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </div>
                </Link>
                <Link href={nextRehearsal ? `/repetitions/${nextRehearsal.id}` : "/repetitions"}
                  className="rounded-xl p-3 flex flex-col justify-between gap-3"
                  style={{ background: "linear-gradient(135deg,#6B3A00,#B05C10)", color: "white" }}>
                  <Calendar className="w-4 h-4" strokeWidth={2} />
                  <div className="flex items-end justify-between">
                    <span className="text-sm font-semibold leading-tight">
                      {rehearsalIsToday ? "Répétition en cours"
                        : nextRehearsal ? `Répétition ${formatDay(nextRehearsal.date, { day: "numeric", month: "short" })}`
                        : "Répétitions"}
                    </span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0" />
                  </div>
                </Link>
              </div>
            </div>
          </section>

          {/* ── Bibliothèque des chants ── */}
          <section>
            <SectionTitle>Bibliothèque des chants</SectionTitle>
            <div className="card flex flex-col gap-5 min-h-[180px]">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-bold" style={{ color: "var(--text-1)" }}>Regarde notre chant</p>
                <Link href="/chants/nouveau" className="btn btn-primary btn-sm flex-shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Je propose
                </Link>
              </div>

              {featured ? (
                <Link href={`/chants/${featured.id}`} className="content-row" style={{ padding: "0.5rem" }}>
                  <div className="content-row-thumb" style={{ background: songGrad, width: 48, height: 48 }}>
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>{featured.title}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                      {[featured.composer, featured.key_signature].filter(Boolean).join(" · ") || featured.liturgical_type || "—"}
                    </p>
                  </div>
                </Link>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucun chant validé pour l&apos;instant.</p>
              )}

              <Link href="/chants" className="btn btn-secondary btn-sm self-start mt-auto">
                Voir tout
              </Link>
            </div>
          </section>
        </div>

        {/* ══ COLONNE DROITE ══ */}
        <div className="space-y-5">

          {/* ── Notifications ── */}
          <section>
            <SectionTitle>Notifications</SectionTitle>
            <NotifWrapper href={lastNotif?.song_id ? `/chants/${lastNotif.song_id}` : null}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                  {unreadCount > 0 ? `${unreadCount} nouveau${unreadCount > 1 ? "x" : ""} message${unreadCount > 1 ? "s" : ""}` : "Aucun nouveau message"}
                </p>
                {lastNotif && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-2)" }}>{lastNotif.message}</p>
                )}
              </div>
              <div className="relative flex-shrink-0">
                <Bell className="w-5 h-5" style={{ color: "var(--gold)" }} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ background: "var(--red)" }} />
                )}
              </div>
            </NotifWrapper>
          </section>

          {/* ── Présence & absence (pas encore de table en base) ── */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionTitle>Présence &amp; absence</SectionTitle>
              <SoonBadge />
            </div>
            <div className="card space-y-2" style={{ padding: "1rem" }}>
              {[
                { label: "Présences", icon: UserCheck, color: "var(--green)" },
                { label: "Absences",  icon: UserX,     color: "var(--red)" },
              ].map(({ label, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ border: "1px solid var(--border)" }}>
                  <span className="flex items-center gap-2 text-sm" style={{ color: "var(--text-1)" }}>
                    <Icon className="w-4 h-4" style={{ color }} /> {label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-3)" }}>—</span>
                </div>
              ))}
              <button type="button" disabled className="btn btn-secondary btn-sm w-full justify-center opacity-60 cursor-not-allowed">
                <CalendarCheck className="w-3.5 h-3.5" /> Valider / Justifier
              </button>
            </div>
          </section>

          {/* ── Divertissement (pas encore de table en base) ── */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <SectionTitle>Divertissement</SectionTitle>
              <SoonBadge />
            </div>
            <div className="card text-center py-8 space-y-2">
              <PartyPopper className="w-6 h-6 mx-auto" style={{ color: "var(--gold)" }} />
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                Les sorties et activités de la chorale apparaîtront ici.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
