/**
 * Types de la page d'accueil (tous les rôles).
 *
 * Les composants du dashboard ne dépendent QUE de ces types : `getDashboardData()`
 * traduit les lignes Supabase vers ces formes.
 * Dates au format ISO "YYYY-MM-DD", heures au format "HH:mm".
 */

/** Lien vers une page. `null` = page pas encore développée (affiché sans lien). */
export type DashboardHref = string | null;

export type DashboardMass = {
  title: string;
  date: string;
  time: string | null;
  meetingTime: string | null;
  location: string | null;
  sheetHref: DashboardHref;
  calendarHref: DashboardHref;
};

/** Couleur liturgique d'un temps (pour l'étiquette du chant) */
export type SeasonTone = "violet" | "gold" | "green" | "neutral";

export type DashboardSong = {
  id: string;
  title: string;
  category: string | null;
  season: string | null;
  seasonTone: SeasonTone;
  addedAt: string; // ISO date-time (création du chant)
  href: DashboardHref;
};

export type DashboardRehearsal = {
  date: string;
  startTime: string | null;
  location: string | null;
  href: DashboardHref;
};

export type DashboardChoirLife = {
  title: string;
  description: string;
  tags: string[];
  photos: { src: string; alt: string }[];
  href: DashboardHref;
};

export type DashboardData = {
  firstName: string | null;
  choirName: string | null;
  nextMass: DashboardMass | null;
  songs: { items: DashboardSong[]; allHref: DashboardHref; addHref: DashboardHref };
  nextRehearsal: DashboardRehearsal | null;
  choirLife: DashboardChoirLife;
};
