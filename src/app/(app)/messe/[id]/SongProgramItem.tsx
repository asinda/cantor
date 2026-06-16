"use client";
import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown, ChevronUp, ExternalLink, Edit2,
  Save, Loader2, CheckCircle, FileText,
} from "lucide-react";
import { LITURGICAL_GRADIENTS, LANGUAGE_LABELS } from "@/types";
import { saveLyricsAction } from "@/actions/songs";
import { useRouter } from "next/navigation";

interface Props {
  entry:    any;
  position: number;
  total:    number;
}

/* Couleur du type liturgique */
const TYPE_COLORS: Record<string, string> = {
  "entrée":     "#7c3aed", "kyrie":      "#6B7280", "gloria":     "#d97706",
  "psaume":     "#059669", "alléluia":   "#b45309", "offertoire": "#0284c7",
  "sanctus":    "#2563eb", "agnus dei":  "#dc2626", "notre père": "#0f766e",
  "communion":  "#16a34a", "sortie":     "#4f46e5",
};

export default function SongProgramItem({ entry, position, total }: Props) {
  const router   = useRouter();
  const song     = entry.songs;
  if (!song) return null;

  const GRAD     = LITURGICAL_GRADIENTS;
  const grad     = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#4A3020,#6B5030)";
  const typeColor= TYPE_COLORS[song.liturgical_type ?? ""] ?? "var(--gold)";
  const lyrics: any[]  = song.song_lyrics ?? [];

  const [open,   setOpen]   = useState(false);
  const [editLang, setEditLang] = useState<string | null>(null);
  const [lyricsMap, setLyricsMap] = useState<Record<string, { text: string; phonetic: string }>>(() => {
    const m: Record<string, { text: string; phonetic: string }> = {};
    lyrics.forEach((l: any) => { m[l.language] = { text: l.lyrics ?? "", phonetic: l.phonetic ?? "" }; });
    return m;
  });
  const [saving, setSaving]  = useState(false);
  const [saved,  setSaved]   = useState(false);
  const [err,    setErr]     = useState("");

  function getLangLabel(code: string) {
    return LANGUAGE_LABELS[code as keyof typeof LANGUAGE_LABELS]
      ?? code.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  async function handleSaveLyrics() {
    const toSave = Object.entries(lyricsMap)
      .filter(([, v]) => v.text.trim())
      .map(([language, v]) => ({ language, lyrics: v.text.trim(), phonetic: v.phonetic.trim() || null }));
    if (!toSave.length) return;
    setSaving(true); setErr("");
    const res = await saveLyricsAction(song.id, toSave);
    setSaving(false);
    if ("error" in res) { setErr(res.error); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  const hasLyrics = lyrics.length > 0;
  const activeLangs = hasLyrics ? lyrics.map((l: any) => l.language) : ["fr"];

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${open ? typeColor + "40" : "var(--border)"}`,
        background: open ? "var(--surface)" : "transparent",
        marginBottom: "0.5rem",
      }}
    >
      {/* ── En-tête cliquable ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: "transparent" }}
      >
        {/* Bande colorée type liturgique */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1"
          style={{ width: 36 }}>
          <span className="text-sm font-black" style={{ color: "var(--text-3)" }}>
            {position}
          </span>
          <div className="w-1 rounded-full"
            style={{ height: 28, background: typeColor, opacity: 0.7 }} />
        </div>

        {/* Cover art */}
        <div className="flex-shrink-0 rounded-lg flex items-center justify-center text-xs font-black"
          style={{ background: grad, width: 44, height: 44, color: "rgba(255,255,255,0.9)" }}>
          {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>
              {song.title}
            </p>
            {song.liturgical_type && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0"
                style={{ background: `${typeColor}15`, color: typeColor }}>
                {song.liturgical_type}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {song.composer && (
              <span className="text-xs" style={{ color: "var(--text-2)" }}>{song.composer}</span>
            )}
            {song.key_signature && (
              <span className="text-xs" style={{ color: "var(--text-3)" }}>♩ {song.key_signature}</span>
            )}
            {/* Badges langue */}
            {song.languages?.map((lang: string) => (
              <span key={lang} className="text-xs px-1.5 py-0.5 rounded font-bold uppercase"
                style={{ background: "var(--surface-2)", color: "var(--text-3)", fontSize: "0.6rem" }}>
                {lang}
              </span>
            ))}
            {hasLyrics
              ? <span className="text-xs" style={{ color: "var(--green)" }}>✓ Paroles</span>
              : <span className="text-xs" style={{ color: "var(--text-3)" }}>Pas de paroles</span>
            }
          </div>
        </div>

        {/* Indicateur expand */}
        <div className="flex-shrink-0">
          {open
            ? <ChevronUp className="w-4 h-4" style={{ color: typeColor }} />
            : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-3)" }} />
          }
        </div>
      </button>

      {/* ── Panneau expansé ── */}
      {open && (
        <div className="px-4 pb-4 space-y-4"
          style={{ borderTop: `1px solid ${typeColor}20` }}>

          {/* Actions rapides */}
          <div className="flex gap-2 pt-2">
            <Link href={`/chants/${song.id}`}
              className="btn btn-secondary btn-sm flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> Voir le chant
            </Link>
            <Link href={`/chants/${song.id}/modifier`}
              className="btn btn-secondary btn-sm flex items-center gap-1.5">
              <Edit2 className="w-3.5 h-3.5" /> Modifier
            </Link>
          </div>

          {/* Paroles — onglets + éditeur */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" style={{ color: typeColor }} />
                <span className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-2)" }}>
                  Paroles
                </span>
              </div>
              {/* Onglets langue */}
              <div className="flex gap-1">
                {activeLangs.map((lang: string) => (
                  <button key={lang} type="button"
                    onClick={() => setEditLang(editLang === lang ? null : lang)}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold transition-all"
                    style={{
                      background: editLang === lang ? typeColor : lyricsMap[lang]?.text.trim() ? `${typeColor}15` : "var(--surface-2)",
                      color: editLang === lang ? "white" : lyricsMap[lang]?.text.trim() ? typeColor : "var(--text-3)",
                      border: `1px solid ${editLang === lang ? typeColor : "var(--border)"}`,
                    }}>
                    {getLangLabel(lang)}
                  </button>
                ))}
                {/* Ajouter une langue */}
                {!hasLyrics && editLang === null && (
                  <button type="button" onClick={() => setEditLang("fr")}
                    className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: "var(--surface-2)", color: "var(--text-3)",
                      border: "1px dashed var(--border)" }}>
                    + Ajouter
                  </button>
                )}
              </div>
            </div>

            {/* Éditeur ou affichage */}
            {editLang ? (
              <div className="space-y-2">
                <textarea
                  value={lyricsMap[editLang]?.text ?? ""}
                  onChange={e => setLyricsMap(prev => ({
                    ...prev,
                    [editLang]: { ...prev[editLang] ?? { phonetic: "" }, text: e.target.value }
                  }))}
                  placeholder={`Paroles en ${getLangLabel(editLang)}…\n\nRefrain :\n…\n\nCouplet 1 :\n…`}
                  rows={10}
                  style={{ fontFamily: "'Courier New', monospace", fontSize: "0.8rem", lineHeight: 1.8 }}
                />
                {err && <p className="text-xs" style={{ color: "var(--red)" }}>{err}</p>}
                <button type="button" onClick={handleSaveLyrics} disabled={saving}
                  className="btn btn-sm w-full justify-center"
                  style={{ background: typeColor, color: "white" }}>
                  {saving
                    ? <><Loader2 className="w-3.5 h-3.5 spin" /> Enregistrement…</>
                    : saved
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Enregistré !</>
                      : <><Save className="w-3.5 h-3.5" /> Enregistrer les paroles</>
                  }
                </button>
              </div>
            ) : hasLyrics ? (
              <div className="space-y-3">
                {lyrics.map((l: any) => (
                  <div key={l.language}>
                    <p className="text-xs font-semibold uppercase mb-1"
                      style={{ color: typeColor }}>
                      {getLangLabel(l.language)}
                    </p>
                    <pre className="text-sm leading-7 whitespace-pre-wrap px-3 py-2 rounded-lg"
                      style={{ fontFamily: "inherit", color: "var(--text-1)",
                        background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      {l.lyrics}
                    </pre>
                    {l.phonetic && (
                      <p className="text-xs mt-1 italic" style={{ color: "var(--text-2)" }}>
                        {l.phonetic}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px dashed var(--border)" }}>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>
                  Aucune parole — cliquez sur une langue pour ajouter
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
