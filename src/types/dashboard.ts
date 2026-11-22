/**
 * Types de la page d'accueil (dashboard choriste).
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

export type AnnouncementTag = "important" | "nouveau" | "rappel";

export type DashboardAnnouncement = {
  id: string;
  tag: AnnouncementTag;
  title: string;
  publishedAt: string; // ISO date-time
  unread: boolean;
  href: DashboardHref;
};

export type AttendanceStatus = "present" | "absent";

export type DashboardAttendance = {
  present: number;
  absent: number;
  since: string;
  recent: {
    id: string;
    date: string;
    kind: "messe" | "repetition";
    status: AttendanceStatus;
  }[];
  historyHref: DashboardHref;
};

export type DashboardContribution = {
  season: string;
  paid: number;
  due: number;
  currency: string;
  deadline: string | null;
  payHref: DashboardHref;
  detailsHref: DashboardHref;
};

export type DashboardSong = {
  id: string;
  title: string;
  category: string | null;
  audience: string | null;
  duration: string | null;
  href: DashboardHref;
};

export type DashboardRehearsal = {
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  note: string | null;
  href: DashboardHref;
};

export type DashboardChoirLife = {
  title: string;
  description: string;
  upcoming: { label: string; date: string }[];
  photos: { src: string; alt: string; caption: string }[];
  href: DashboardHref;
};

export type DashboardData = {
  firstName: string | null;
  choirName: string | null;
  nextMass: DashboardMass | null;
  announcements: { items: DashboardAnnouncement[]; allHref: DashboardHref };
  attendance: DashboardAttendance | null;
  contribution: DashboardContribution | null;
  songs: { items: DashboardSong[]; allHref: DashboardHref; proposeHref: DashboardHref };
  nextRehearsal: DashboardRehearsal | null;
  choirLife: DashboardChoirLife;
};
