export type Language = "fr" | "ki" | "sw" | "en";

export const LANGUAGE_LABELS: Record<Language, string> = {
  fr: "Français", ki: "Kirundi", sw: "Swahili", en: "English",
};

export const LITURGICAL_TYPE_VALUES = [
  "entrée", "kyrie", "gloria", "psaume", "alléluia",
  "sanctus", "agnus dei", "communion", "sortie",
] as const;
export type LiturgicalType = (typeof LITURGICAL_TYPE_VALUES)[number];

export const LITURGICAL_TYPES = LITURGICAL_TYPE_VALUES.map((v) => ({
  value: v,
  label: v.charAt(0).toUpperCase() + v.slice(1),
}));

export const LITURGICAL_SEASONS = [
  "avent", "noël", "carême", "pâques", "temps ordinaire", "tous",
] as const;
export type LiturgicalSeason = (typeof LITURGICAL_SEASONS)[number];

export const DIFFICULTIES = ["facile", "moyen", "difficile"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const VOICE_PARTS = ["soprano", "alto", "ténor", "basse"] as const;
export type VoicePart = (typeof VOICE_PARTS)[number];

export const SONG_STATUSES = ["nouveau", "en_cours", "appris"] as const;
export type SongStatus = (typeof SONG_STATUSES)[number];

export const VERSION_TYPES = [
  "choral", "karaoke", "satb", "soprano", "alto", "ténor", "basse", "instrumental",
] as const;
export type VersionType = (typeof VERSION_TYPES)[number];

export const MUSICAL_KEYS = [
  "Do majeur", "Sol majeur", "Ré majeur", "La majeur", "Mi majeur", "Si majeur",
  "Fa majeur", "Si♭ majeur", "Mi♭ majeur", "La♭ majeur",
  "La mineur", "Mi mineur", "Si mineur", "Fa# mineur", "Do# mineur",
  "Ré mineur", "Sol mineur", "Do mineur", "Fa mineur",
] as const;

export const LITURGICAL_GRADIENTS: Record<string, string> = {
  "entrée":     "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
  "kyrie":      "linear-gradient(135deg, #374151 0%, #4b5563 100%)",
  "gloria":     "linear-gradient(135deg, #d97706 0%, #ea580c 100%)",
  "psaume":     "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
  "alléluia":   "linear-gradient(135deg, #ca8a04 0%, #d97706 100%)",
  "sanctus":    "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
  "agnus dei":  "linear-gradient(135deg, #dc2626 0%, #be185d 100%)",
  "communion":  "linear-gradient(135deg, #16a34a 0%, #059669 100%)",
  "sortie":     "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
};

export const LITURGICAL_COLORS: Record<string, string> = {
  "entrée":    "bg-purple-100 text-purple-800",
  "kyrie":     "bg-slate-100 text-slate-700",
  "gloria":    "bg-yellow-100 text-yellow-800",
  "psaume":    "bg-green-100 text-green-800",
  "alléluia":  "bg-amber-100 text-amber-800",
  "sanctus":   "bg-blue-100 text-blue-800",
  "agnus dei": "bg-red-100 text-red-800",
  "communion": "bg-emerald-100 text-emerald-800",
  "sortie":    "bg-indigo-100 text-indigo-800",
};

export const STATUS_COLORS: Record<string, string> = {
  "nouveau":  "text-gray-400",
  "en_cours": "text-orange-400",
  "appris":   "text-green-400",
};

export const STATUS_BG: Record<string, string> = {
  "nouveau":  "bg-gray-900 text-gray-400 border border-gray-700",
  "en_cours": "bg-orange-950 text-orange-400 border border-orange-800",
  "appris":   "bg-green-950 text-green-400 border border-green-800",
};

// ── Database row types ─────────────────────────────────────────

export type Choir = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
};

export type Song = {
  id: string;
  choir_id: string;
  created_by: string | null;
  title: string;
  languages: string[];
  liturgical_type: string | null;
  liturgical_season: string | null;
  difficulty: string | null;
  mood: string | null;
  key_signature: string | null;
  tempo_bpm: number | null;
  structure: { type: string; text: string }[] | null;
  chords: string | null;
  score_url: string | null;
  audio_url: string | null;
  audio_soprano: string | null;
  audio_alto: string | null;
  audio_tenor: string | null;
  audio_bass: string | null;
  musical_notes: string | null;
  internal_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // joined
  lyrics?: SongLyric[];
  youtube_links?: YoutubeLink[];
  voice_guides?: VoiceGuide[];
};

export type SongLyric = {
  id: string;
  song_id: string;
  language: string;
  lyrics: string | null;
  phonetic: string | null;
};

export type YoutubeLink = {
  id: string;
  song_id: string;
  url: string;
  video_id: string | null;
  title: string | null;
  channel: string | null;
  thumbnail: string | null;
  version_type: string;
  is_primary: boolean;
  detected_key: string | null;
  detected_bpm: number | null;
  created_at: string;
};

export type VoiceGuide = {
  id: string;
  song_id: string;
  voice_part: string;
  starting_note: string | null;
  entry_seconds: number | null;
  instructions: string | null;
  audio_ref_url: string | null;
};

export type Rehearsal = {
  id: string;
  choir_id: string;
  date: string;
  notes: string | null;
  created_at: string;
};

export type MassSheet = {
  id: string;
  choir_id: string;
  title: string;
  date: string | null;
  liturgical_season: string | null;
  notes: string | null;
  created_at: string;
};
