import { getRehearsal, getRehearsalProgram } from "@/services/repetitions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Music, Edit2, Clock, MapPin } from "lucide-react";
import { LITURGICAL_GRADIENTS } from "@/types";
import DeleteRehearsalButton from "./DeleteRehearsalButton";
import MasteryButton from "./MasteryButton";

export default async function RehearsalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: rehearsal }, { data: rehearsalSongs }] = await Promise.all([
    getRehearsal(id),
    getRehearsalProgram(id),
  ]);

  if (!rehearsal) notFound();

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const songs = (rehearsalSongs ?? []).sort((a: any, b: any) => a.order_index - b.order_index);

  const dateStr = new Date(rehearsal.date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = rehearsal.time
    ? rehearsal.time.slice(0, 5)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <Link href="/repetitions" className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> Répétitions
        </Link>
        <div className="flex gap-2">
          <Link href={`/repetitions/${id}/modifier`} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
            <Edit2 className="w-3.5 h-3.5" /> Modifier
          </Link>
          <DeleteRehearsalButton id={id} />
        </div>
      </div>

      {/* Hero */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="p-5" style={{ background: "linear-gradient(135deg,#5C3200,#A0621A)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <Calendar className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight capitalize">{dateStr}</h1>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {timeStr && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                <Clock className="w-3.5 h-3.5" /> {timeStr}
              </span>
            )}
            {rehearsal.location && (
              <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>
                <MapPin className="w-3.5 h-3.5" /> {rehearsal.location}
              </span>
            )}
          </div>
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
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#8B5CF6,#22C55E)";
              return (
                <div key={i}>
                  <div className="song-row">
                    <span className="w-6 text-center text-sm font-black flex-shrink-0"
                      style={{ color: "var(--text-3)" }}>
                      {entry.order_index}
                    </span>
                    <Link href={`/chants/${song.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="cover-art flex-shrink-0"
                        style={{ background: grad, width: 42, height: 42, fontSize: "0.6rem", fontWeight: 900 }}>
                        {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" style={{ color: "var(--text-1)" }}>{song.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                          {[song.composer, song.key_signature].filter(Boolean).join(" · ") || song.liturgical_type || "—"}
                        </p>
                      </div>
                    </Link>
                    <MasteryButton songId={song.id} initialStatus={song.status ?? "nouveau"} />
                  </div>
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
