import type { DashboardData, SeasonTone } from "@/types/dashboard";
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

/** Couleur liturgique de chaque temps (valeurs de LITURGICAL_SEASONS) */
const SEASON_TONES: Record<string, SeasonTone> = {
  "avent": "violet",
  "carême": "violet",
  "noël": "gold",
  "pâques": "gold",
  "temps ordinaire": "green",
};

/**
 * Point d'entrée UNIQUE des données de l'accueil.
 * Chaque nouvelle fonctionnalité se branche ici, sans toucher aux composants.
 */
export async function getDashboardData(ctx: DashboardContext): Promise<DashboardData> {
  const today = todayParis();

  const [massRes, rehearsalRes, songsRes] = await Promise.all([
    getNextMassSheet(ctx.choirId, today),
    getNextRehearsal(ctx.choirId, today),
    getLatestValidatedSongs(ctx.choirId, 7),
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

    songs: {
      allHref: "/chants",
      addHref: "/chants/nouveau",
      items: (songsRes.data ?? []).map((s) => ({
        id: s.id,
        title: s.title,
        category: capitalize(s.liturgical_type),
        season: capitalize(s.liturgical_season),
        seasonTone: SEASON_TONES[s.liturgical_season ?? ""] ?? "neutral",
        addedAt: s.created_at,
        href: `/chants/${s.id}`,
      })),
    },

    nextRehearsal: rehearsal
      ? {
          date: rehearsal.date,
          startTime: hhmm(rehearsal.time),
          location: rehearsal.location,
          href: `/repetitions/${rehearsal.id}`,
        }
      : null,

    // Texte et photos de présentation (statiques) ; les rendez-vous viendront d'une table events
    choirLife: {
      title: "Plus qu’un chœur, une famille",
      description: "Sorties, fêtes, anniversaires : les moments partagés en dehors des messes.",
      tags: ["Fêtes", "Sorties", "Anniversaires", "Retraites"],
      photos: [
        { src: "/images/dashboard/choristes-livrets.png", alt: "Choristes chantant avec leurs livrets" },
        { src: "/images/dashboard/eglise-coucher-soleil.png", alt: "Église au coucher du soleil" },
        { src: "/images/dashboard/bougie-croix.png", alt: "Bougie allumée près d’une croix" },
      ],
      href: null, // page Vie chorale pas encore développée
    },
  };
}
