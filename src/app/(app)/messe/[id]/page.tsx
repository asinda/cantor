import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Music } from "lucide-react";
import { LITURGICAL_GRADIENTS } from "@/types";

export default async function MasseSheetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("mass_sheets")
    .select("*")
    .eq("id", id)
    .single();

  if (!sheet) notFound();

  const { data: sheetSongs } = await supabase
    .from("mass_sheet_songs")
    .select("position, songs(id,title,liturgical_type,key_signature,composer,status)")
    .eq("mass_sheet_id", id)
    .order("position");

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const songs = (sheetSongs ?? []).sort((a, b) => a.position - b.position);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <Link href="/messe" className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> Feuilles
        </Link>
      </div>

      {/* Hero */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="p-5"
          style={{ background: "linear-gradient(135deg, #1A1040 0%, #0D1A30 100%)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(127,119,221,0.25)" }}>
            <BookOpen className="w-6 h-6" style={{ color: "#7F77DD" }} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">{sheet.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            {sheet.date && (
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                {new Date(sheet.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
            {sheet.liturgical_season && (
              <span className="text-xs px-2.5 py-1 rounded-lg font-bold capitalize"
                style={{ background: "rgba(127,119,221,0.2)", color: "#7F77DD" }}>
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

      {/* Programme */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Programme</h2>
          <span className="text-xs" style={{ color: "var(--text-2)" }}>{songs.length} chants</span>
        </div>

        {songs.length === 0 ? (
          <div className="card text-center py-8">
            <Music className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucun chant dans cette feuille.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: "0.5rem" }}>
            {songs.map((entry: any, i: number) => {
              const song = entry.songs;
              if (!song) return null;
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)";
              return (
                <div key={i}>
                  <Link href={`/chants/${song.id}`} className="song-row">
                    <span className="w-6 text-center text-sm font-black flex-shrink-0"
                      style={{ color: "var(--text-3)" }}>
                      {entry.position}
                    </span>
                    <div className="cover-art flex-shrink-0"
                      style={{ background: grad, width: 42, height: 42, fontSize: "0.6rem", fontWeight: 900 }}>
                      {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{song.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                        {[song.composer, song.key_signature].filter(Boolean).join(" · ") || song.liturgical_type || "—"}
                      </p>
                    </div>
                  </Link>
                  {i < songs.length - 1 && <div className="divider mx-3" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
