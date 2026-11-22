import type { DashboardData } from "@/types/dashboard";
import { getNextMassSheet } from "@/services/messe";
import { getNextRehearsal } from "@/services/repetitions";
import { getLatestValidatedSongs } from "@/services/songs";
import { todayParis } from "@/components/dashboard/format";

type DashboardContext = {
  userId: string;
  choirId: string;
  firstName: string | null;
  choirName: string | null;
};

const capitalize = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : null);

/** "14:00:00" (colonne TIME) → "14:00" */
const hhmm = (time: string | null) => (time ? time.slice(0, 5) : null);

/**
 * Point d'entrée UNIQUE des données de l'accueil.
 *
 * Les sections sans table en base (annonces, présences, contribution, événements)
 * renvoient un état vide : les cartes affichent leur message « aucun… ».
 * Chaque nouvelle fonctionnalité se branche ici, sans toucher aux composants.
 */
export async function getDashboardData(ctx: DashboardContext): Promise<DashboardData> {
  const today = todayParis();

  const [massRes, rehearsalRes, songsRes] = await Promise.all([
    getNextMassSheet(ctx.choirId, today),
    getNextRehearsal(ctx.choirId, today),
    getLatestValidatedSongs(ctx.choirId, 4),
  ]);

  const mass = massRes.data;
  const rehearsal = rehearsalRes.data;

  return {
    firstName: ctx.firstName,
    choirName: ctx.choirName,

    // mass_sheets n'a pas (encore) de colonnes heure / lieu / rendez-vous
    nextMass: mass?.date
      ? {
          title: mass.title,
          date: mass.date,
          time: null,
          meetingTime: null,
          location: null,
          sheetHref: `/messe/${mass.id}`,
          calendarHref: "/messe",
        }
      : null,

    announcements: { items: [], allHref: null },   // TODO: table announcements (à créer)
    attendance: null,                              // TODO: table attendances (à créer, appel par le chantre)
    contribution: null,                            // TODO: table contributions (à créer)

    songs: {
      allHref: "/chants",
      proposeHref: "/chants/nouveau",
      items: (songsRes.data ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        category: capitalize(s.liturgical_type),
        audience: capitalize(s.liturgical_season),
        duration: null, // pas de colonne durée sur songs
        href: `/chants/${s.id}`,
      })),
    },

    // rehearsals n'a pas d'heure de fin
    nextRehearsal: rehearsal
      ? {
          date: rehearsal.date,
          startTime: hhmm(rehearsal.time),
          endTime: null,
          location: rehearsal.location,
          note: null,
          href: `/repetitions/${rehearsal.id}`,
        }
      : null,

    // Texte et photos de présentation (statiques) ; les rendez-vous viendront d'une table events
    choirLife: {
      title: "Plus qu’une chorale, une famille",
      description:
        "Revivez nos grands moments : sorties, concerts, fêtes et pèlerinages. Photos, souvenirs et prochains rendez-vous, tout est ici.",
      upcoming: [], // TODO: table events (à créer)
      photos: [
        { src: "/images/dashboard/choristes-livrets.png", alt: "Choristes chantant avec leurs livrets", caption: "Concerts" },
        { src: "/images/dashboard/eglise-coucher-soleil.png", alt: "Église au coucher du soleil", caption: "Sorties" },
        { src: "/images/dashboard/bougie-croix.png", alt: "Bougie allumée près d’une croix", caption: "Célébrations" },
      ],
      href: null,
    },
  };
}
