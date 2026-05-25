import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Music } from "lucide-react";
import { LITURGICAL_GRADIENTS } from "@/types";

export default async function RehearsalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: rehearsal } = await supabase
    .from("rehearsals").select("*").eq("id", id).single();

  if (!rehearsal) notFound();

  const { data: rehearsalSongs } = await supabase
    .from("rehearsal_songs")
    .select("order_index, songs(id,title,liturgical_type,key_signature,status,composer)")
    .eq("rehearsal_id", id)
    .order("order_index");

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const songs = (rehearsalSongs ?? []).sort((a, b) => a.order_index - b.order_index);

  const dateStr = new Date(rehearsal.date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = new Date(rehearsal.date).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href="/repetitions" className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Répétitions
      </Link>

      {/* Hero */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="p-5"
          style={{ background: "linear-gradient(135deg, #1A100A 0%, #1A1A0A 100%)" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
            style={{ background: "rgba(245,158,11,0.2)" }}>
            <Calendar className="w-6 h-6" style={{ color: "#F59E0B" }} />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight capitalize">{dateStr}</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{timeStr}</p>
        </div>
        {rehearsal.notes && (
          <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{rehearsal.notes}</p>
          </div>
        )}
      </div>

      {/* Chants */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Chants au programme</h2>
          <span className="text-xs" style={{ color: "var(--text-2)" }}>{songs.length} chants</span>
        </div>

        {songs.length === 0 ? (
          <div className="card text-center py-8">
            <Music className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucun chant au programme.</p>
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
                      {entry.order_index}
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
