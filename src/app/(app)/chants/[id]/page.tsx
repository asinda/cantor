import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Music, ExternalLink, Mic2, FileText } from "lucide-react";
import { LITURGICAL_GRADIENTS, STATUS_BG, LANGUAGE_LABELS } from "@/types";
import DeleteSongButton from "./DeleteSongButton";
import VoiceTools from "@/components/player/VoiceTools";
import AIPanel from "@/components/player/AIPanel";
import YoutubeLinks from "./YoutubeLinks";

export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: song }, { data: lyrics }, { data: youtube }, { data: voices }] = await Promise.all([
    supabase.from("songs").select("*").eq("id", id).single(),
    supabase.from("song_lyrics").select("*").eq("song_id", id).order("language"),
    supabase.from("youtube_links").select("*").eq("song_id", id).order("version_type"),
    supabase.from("voice_guides").select("*").eq("song_id", id).order("voice_part"),
  ]);

  if (!song) notFound();

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)";

  const VOICE_COLORS: Record<string, string> = {
    soprano: "#f472b6",
    alto:    "#fb923c",
    tenor:   "#60a5fa",
    bass:    "#4ade80",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">

      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/chants" className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> Chants
        </Link>
        <div className="flex gap-2">
          <Link href={`/chants/${id}/modifier`} className="btn btn-secondary btn-sm" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
            <Edit2 className="w-3.5 h-3.5" /> Modifier
          </Link>
          <DeleteSongButton id={id} />
        </div>
      </div>

      {/* Hero */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="h-40 flex items-end p-5 relative"
          style={{ background: grad }}>
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6))" }} />
          <div className="relative z-10">
            <span className={`badge mb-2 ${STATUS_BG[song.status ?? ""] ?? "bg-gray-900 text-gray-400 border border-gray-700"}`}>
              {song.status?.replace("_", " ")}
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight leading-tight">{song.title}</h1>
            <p className="text-sm mt-1 text-white/70">
              {[song.composer, song.key_signature, song.time_signature].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {song.liturgical_type && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)" }}>Type</p>
              <p className="text-sm font-semibold text-white">{song.liturgical_type}</p>
            </div>
          )}
          {song.tempo_bpm && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)" }}>BPM</p>
              <p className="text-sm font-semibold text-white">{song.tempo_bpm}</p>
            </div>
          )}
          {song.languages?.length > 0 && (
            <div className="col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-3)" }}>Langues</p>
              <div className="flex gap-2">
                {song.languages.map((lang: string) => (
                  <span key={lang}
                    className="text-xs px-2.5 py-1 rounded-lg font-bold uppercase"
                    style={{ background: "var(--violet-dim)", color: "#7F77DD" }}>
                    {LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS] ?? lang}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Voice Tools + AI Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <VoiceTools
          track={{ id: song.id, title: song.title, liturgical_type: song.liturgical_type, composer: song.composer }}
          voiceGuides={voices ?? []}
          youtubeLinks={youtube ?? []}
        />
        <AIPanel
          bpm={song.tempo_bpm}
          keySignature={song.key_signature}
          difficulty={song.difficulty}
          liturgicalType={song.liturgical_type}
          languages={song.languages}
        />
      </div>

      {/* Notes */}
      {song.notes && (
        <div className="card space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4" style={{ color: "#7F77DD" }} />
            <h2 className="font-bold text-sm text-white">Notes</h2>
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-2)" }}>
            {song.notes}
          </p>
        </div>
      )}

      {/* Paroles */}
      {lyrics && lyrics.length > 0 && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "#1D9E75" }} />
            <h2 className="font-bold text-sm text-white">Paroles</h2>
          </div>
          {lyrics.map((lyric: any) => (
            <div key={lyric.language} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-lg font-bold uppercase"
                  style={{ background: "rgba(29,158,117,0.15)", color: "#1D9E75" }}>
                  {LANGUAGE_LABELS[lyric.language as keyof typeof LANGUAGE_LABELS] ?? lyric.language}
                </span>
              </div>
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans"
                style={{ color: "var(--text-2)", fontFamily: "inherit" }}>
                {lyric.lyrics}
              </pre>
              {lyric.phonetic && (
                <div className="px-3 py-2 rounded-xl"
                  style={{ background: "var(--surface-3)", borderLeft: "2px solid #1D9E75" }}>
                  <p className="text-xs font-bold uppercase mb-1" style={{ color: "#1D9E75" }}>
                    Prononciation
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
                    {lyric.phonetic}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Voice guides */}
      {voices && voices.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4" style={{ color: "#7F77DD" }} />
            <h2 className="font-bold text-sm text-white">Guides vocaux</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {voices.map((v: any) => {
              const color = VOICE_COLORS[v.voice_part] ?? "#7F77DD";
              return (
                <div key={v.id} className="rounded-xl p-3"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <p className="text-xs font-bold uppercase tracking-wider text-white capitalize">
                      {v.voice_part}
                    </p>
                  </div>
                  {v.starting_note && (
                    <p className="text-lg font-black" style={{ color }}>
                      {v.starting_note}
                    </p>
                  )}
                  {v.entry_seconds && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                      Entrée : {v.entry_seconds}s
                    </p>
                  )}
                  {v.instructions && (
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>
                      {v.instructions}
                    </p>
                  )}
                  {v.audio_url && (
                    <audio src={v.audio_url} controls className="mt-2" style={{ height: 32 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* YouTube links */}
      {youtube && youtube.length > 0 && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" style={{ color: "#FF4444" }} />
            <h2 className="font-bold text-sm text-white">Liens YouTube</h2>
          </div>
          <YoutubeLinks
            links={youtube}
            track={{ id: song.id, title: song.title, liturgical_type: song.liturgical_type, composer: song.composer }}
          />
        </div>
      )}

      {/* Add links CTA */}
      <Link href={`/chants/${id}/modifier`}
        className="card flex items-center gap-3 hover:border-opacity-30 transition-all"
        style={{ padding: "0.875rem 1rem" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--violet-dim)" }}>
          <Music className="w-4 h-4" style={{ color: "#7F77DD" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Enrichir ce chant</p>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>Paroles, guides vocaux, YouTube…</p>
        </div>
        <Edit2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
      </Link>
    </div>
  );
}
