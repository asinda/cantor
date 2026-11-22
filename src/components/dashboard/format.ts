import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

/** "2026-11-01" → "Dimanche 1er novembre" */
export function formatLongDay(isoDate: string) {
  const d = parseISO(isoDate);
  const label = format(d, "EEEE d MMMM", { locale: fr }).replace(/^(\w+) 1 /, "$1 1er ");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2026-10-24" → "Sam. 24 oct." */
export function formatShortDay(isoDate: string) {
  const label = format(parseISO(isoDate), "EEE d MMM", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2026-11-14" → "14 nov." */
export function formatDayMonth(isoDate: string) {
  return format(parseISO(isoDate), "d MMM", { locale: fr });
}

/** "10:30" → "10h30" ; "14:00" → "14h00" */
export function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(":");
  return `${Number(h)}h${m}`;
}

/** Date du jour à Paris au format YYYY-MM-DD (les colonnes `date` sont des DATE sans fuseau) */
export function todayParis() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());
}

/** Nombre de jours avant une date → "Aujourd'hui", "Demain", "Dans 4 jours" */
export function formatCountdown(isoDate: string) {
  const n = differenceInCalendarDays(parseISO(isoDate), parseISO(todayParis()));
  if (n <= 0) return "Aujourd’hui";
  if (n === 1) return "Demain";
  return `Dans ${n} jours`;
}

/** ISO date-time → "il y a 2 heures" */
export function formatAgo(isoDateTime: string) {
  return `il y a ${formatDistanceToNowStrict(parseISO(isoDateTime), { locale: fr })}`;
}

/** Salutation selon l'heure de Paris (le serveur peut être en UTC) */
export function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hour12: false, timeZone: "Europe/Paris" }).format(new Date()),
  );
  return hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
}

/** Date du jour à Paris → "Mardi 27 octobre" */
export function todayLabel() {
  const label = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris",
  }).format(new Date());
  return label.charAt(0).toUpperCase() + label.slice(1);
}
