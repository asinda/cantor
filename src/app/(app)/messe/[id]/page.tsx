import { getMassSheet, getMassSheetProgram } from "@/services/messe";
import { getAuthContext } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Music, Edit2 } from "lucide-react";
import { LITURGICAL_GRADIENTS, LANGUAGE_LABELS } from "@/types";
import DeleteSheetButton from "./DeleteSheetButton";
import PrintButton from "./PrintButton";
import SongProgramItem from "./SongProgramItem";

const SEASON_GRAD: Record<string, string> = {
  "avent":           "linear-gradient(135deg, #1E0A3C 0%, #2D1B69 100%)",
  "noël":            "linear-gradient(135deg, #3B0A0A 0%, #7F1D1D 100%)",
  "carême":          "linear-gradient(135deg, #1C0A00 0%, #451A03 100%)",
  "pâques":          "linear-gradient(135deg, #1A1400 0%, #451A03 100%)",
  "temps ordinaire": "linear-gradient(135deg, #041D0E 0%, #064E3B 100%)",
};

export default async function MasseSheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { choirName } = await getAuthContext();

  const [{ data: sheet }, { data: sheetSongs }] = await Promise.all([
    getMassSheet(id),
    getMassSheetProgram(id),
  ]);

  if (!sheet) notFound();

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const resolvedChoirName = choirName ?? "Cantor";
  const songs = (sheetSongs ?? []).sort((a: any, b: any) => a.position - b.position);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">

      {/* Nav bar — hidden on print */}
      <div className="flex items-center justify-between no-print">
        <Link href="/messe" className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> Feuilles
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <Link href={`/messe/${id}/modifier`} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
            <Edit2 className="w-3.5 h-3.5" /> Modifier
          </Link>
          <DeleteSheetButton id={id} />
        </div>
      </div>

      {/* Print header — screen: hidden / print: visible */}
      <div className="print-only" style={{ textAlign: "center", paddingBottom: "1rem", borderBottom: "2px solid #111", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555" }}>
          {resolvedChoirName}
        </p>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900, margin: "0.25rem 0" }}>{sheet.title}</h1>
        {sheet.date && (
          <p style={{ fontSize: "0.9rem", color: "#444" }}>
            {new Date(sheet.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
        {sheet.liturgical_season && (
          <p style={{ fontSize: "0.8rem", fontStyle: "italic", color: "#666", marginTop: "0.25rem" }}>
            {sheet.liturgical_season.charAt(0).toUpperCase() + sheet.liturgical_season.slice(1)}
          </p>
        )}
      </div>

      {/* Hero — screen only */}
      <div className="card overflow-hidden no-print" style={{ padding: 0 }}>
        <div className="p-5"
          style={{ background: SEASON_GRAD[sheet.liturgical_season ?? ""] ?? "linear-gradient(135deg, #1A1040 0%, #0D1A30 100%)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>{sheet.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {sheet.date && (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                {new Date(sheet.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {sheet.liturgical_season && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold capitalize"
                style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                {sheet.liturgical_season}
              </span>
            )}
          </div>
        </div>
        {sheet.notes && (
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{sheet.notes}</p>
          </div>
        )}
      </div>

      {/* Print notes */}
      {sheet.notes && (
        <div className="print-only" style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #ddd", borderRadius: "0.5rem" }}>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>{sheet.notes}</p>
        </div>
      )}

      {/* Programme */}
      <div>
        <div className="section-header no-print">
          <h2 className="section-title">Programme</h2>
          <span className="text-xs" style={{ color: "var(--text-2)" }}>{songs.length} chants</span>
        </div>

        {/* Print programme title */}
        <h2 className="print-only" style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.75rem", borderBottom: "1px solid #ccc", paddingBottom: "0.4rem" }}>
          Programme — {songs.length} chant{songs.length !== 1 ? "s" : ""}
        </h2>

        {songs.length === 0 ? (
          <div className="card text-center py-8 no-print">
            <Music className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucun chant dans cette feuille.</p>
          </div>
        ) : (
          <div className="no-print space-y-1">
            {songs.map((entry: any, i: number) => (
              <SongProgramItem
                key={entry.songs?.id ?? i}
                entry={entry}
                position={entry.position ?? i + 1}
                total={songs.length}
              />
            ))}
          </div>
        )}

        {/* Impression uniquement */}
        {songs.length > 0 && (
          <div className="print-only">
            {songs.map((entry: any, i: number) => {
              const song = entry.songs;
              if (!song) return null;
              const lyrics: any[] = song.song_lyrics ?? [];
              return (
                <div key={i} style={{ padding: "0.75rem 0.25rem", breakInside: "avoid" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: 900, minWidth: "1.5rem" }}>{entry.position}.</span>
                    <div>
                      <span style={{ fontSize: "1rem", fontWeight: 800 }}>{song.title}</span>
                      {(song.liturgical_type || song.key_signature || song.composer) && (
                        <span style={{ fontSize: "0.75rem", color: "#555", marginLeft: "0.5rem" }}>
                          {[song.liturgical_type, song.key_signature, song.composer].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>
                  {lyrics.length > 0 && (
                    <div style={{ marginLeft: "2.25rem", marginTop: "0.5rem" }}>
                      {lyrics.map((l: any) => (
                        <div key={l.language} style={{ marginBottom: "0.75rem" }}>
                          {lyrics.length > 1 && (
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", marginBottom: "0.2rem" }}>
                              {LANGUAGE_LABELS[l.language as keyof typeof LANGUAGE_LABELS] ?? l.language}
                            </p>
                          )}
                          <pre style={{ fontSize: "0.85rem", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                            {l.lyrics}
                          </pre>
                          {l.phonetic && (
                            <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: "#555", marginTop: "0.25rem" }}>
                              {l.phonetic}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
