import { getSong, getSongLyrics, getSongYoutubeLinks, getVoiceGuides } from "@/services/songs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Edit2, Music, ExternalLink, Mic2, FileText, Clock, Hash, BarChart2 } from "lucide-react";
import { LITURGICAL_GRADIENTS, LANGUAGE_LABELS } from "@/types";
import DeleteSongButton from "./DeleteSongButton";
import VoiceTools from "@/components/player/VoiceTools";
import YoutubeLinks from "./YoutubeLinks";
import SongValidationBar from "./SongValidationBar";
import InlineLyricsEditor from "./InlineLyricsEditor";
import { getAuthContext } from "@/lib/auth";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  nouveau:  { bg: "rgba(154,125,90,0.1)",  color: "#9A7D5A", label: "Nouveau"  },
  en_cours: { bg: "rgba(160,98,26,0.12)",  color: "#A0621A", label: "En cours" },
  appris:   { bg: "rgba(74,124,89,0.12)",  color: "#4A7C59", label: "Appris"   },
};

const DIFF_COLOR: Record<string, string> = {
  facile: "#4A7C59", moyen: "#A0621A", difficile: "#9B1C1C",
};

const VOICE_COLORS: Record<string, string> = {
  soprano: "#C2185B", alto: "#E65100", tenor: "#1565C0", basse: "#2E7D32",
};

export default async function SongDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { userId, choirId } = await getAuthContext();

  const [{ data: song }, { data: lyrics }, { data: youtube }, { data: voices }] = await Promise.all([
    getSong(id),
    getSongLyrics(id),
    getSongYoutubeLinks(id),
    getVoiceGuides(id),
  ]);

  if (!song) notFound();

  // Vérifier si l'utilisateur est chef
  const { createClient } = await import("@/lib/supabase/server");
  const sb = await createClient();
  const { data: member } = await sb
    .from("choir_members")
    .select("role")
    .eq("user_id", userId)
    .eq("choir_id", choirId ?? "")
    .single();
  const isChef = member?.role === "chef";

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const grad  = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#5C3200,#A0621A)";
  const st    = STATUS_STYLE[song.status ?? ""] ?? STATUS_STYLE.nouveau;
  const hasVoices  = voices && voices.length > 0;
  const hasLyrics  = lyrics && lyrics.length > 0;
  const hasYoutube = youtube && youtube.length > 0;

  return (
    <div className="max-w-3xl mx-auto px-5 pt-5 pb-24 space-y-5 fade-in">

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between">
        <Link href="/chants" className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> Bibliothèque
        </Link>
        <div className="flex gap-2">
          <Link href={`/chants/${id}/modifier`} className="btn btn-secondary btn-sm">
            <Edit2 className="w-3.5 h-3.5" /> Modifier
          </Link>
          <DeleteSongButton id={id} />
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)", boxShadow: "0 2px 12px rgba(26,18,9,0.08)" }}>

        <div className="h-36 relative flex items-end p-5" style={{ background: grad }}>
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55))" }} />
          <div className="relative z-10 w-full">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {song.liturgical_type && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>
                  {song.liturgical_type}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full font-bold"
                style={{ background: st.bg, color: st.color }}>
                {st.label}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{song.title}</h1>
            {song.composer && (
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{song.composer}</p>
            )}
          </div>
        </div>

        {/* Métadonnées */}
        <div className="px-5 py-3 flex flex-wrap gap-4" style={{ background: "var(--surface)" }}>
          {song.key_signature && (
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{song.key_signature}</span>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>· Tonalité</span>
            </div>
          )}
          {song.tempo_bpm && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{song.tempo_bpm} BPM</span>
            </div>
          )}
          {song.difficulty && (
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} />
              <span className="text-sm font-semibold capitalize"
                style={{ color: DIFF_COLOR[song.difficulty] ?? "var(--text-2)" }}>
                {song.difficulty}
              </span>
            </div>
          )}
          {song.liturgical_season && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
              style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
              {song.liturgical_season}
            </span>
          )}
          {song.languages?.map((lang: string) => (
            <span key={lang} className="text-xs px-2 py-0.5 rounded-full font-bold uppercase"
              style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)" }}>
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* ── Player ── */}
      {(hasVoices || hasYoutube) && (
        <VoiceTools
          track={{ id: song.id, title: song.title, liturgical_type: song.liturgical_type, composer: song.composer }}
          voiceGuides={voices ?? []}
          youtubeLinks={youtube ?? []}
        />
      )}

      {/* ── Paroles — éditeur inline ── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between pb-3"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
              Paroles
            </h2>
            {hasLyrics && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
                {lyrics!.length} langue{lyrics!.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <InlineLyricsEditor
          songId={id}
          initialLyrics={lyrics ?? []}
        />
      </div>

      {/* ── Guides vocaux ── */}
      {hasVoices && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Guides vocaux</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {voices!.map((v: any) => {
              const color = VOICE_COLORS[v.voice_part] ?? "#9A7D5A";
              return (
                <div key={v.id} className="rounded-xl p-3 space-y-2"
                  style={{ background: "var(--surface-2)", border: `1px solid ${color}30` }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: `${color}18`, color }}>
                      {v.voice_part.slice(0, 1).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold capitalize" style={{ color: "var(--text-1)" }}>
                      {v.voice_part}
                    </p>
                  </div>
                  {v.starting_note && (
                    <p className="text-2xl font-black leading-none" style={{ color }}>{v.starting_note}</p>
                  )}
                  {v.entry_seconds != null && (
                    <p className="text-xs" style={{ color: "var(--text-2)" }}>Entrée : {v.entry_seconds}s</p>
                  )}
                  {v.instructions && (
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{v.instructions}</p>
                  )}
                  {v.audio_ref_url && <audio src={v.audio_ref_url} controls style={{ height: 28, width: "100%" }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── YouTube ── */}
      {hasYoutube && (
        <div className="card space-y-3">
          <div className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" style={{ color: "#CC0000" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Vidéos YouTube</h2>
          </div>
          <YoutubeLinks
            links={youtube!}
            track={{ id: song.id, title: song.title, liturgical_type: song.liturgical_type, composer: song.composer }}
          />
        </div>
      )}

      {/* ── Notes ── */}
      {song.notes && (
        <div className="card space-y-2">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Notes du chef de chœur</h2>
          </div>
          <div className="rounded-xl p-4"
            style={{ background: "var(--surface-2)", borderLeft: "3px solid var(--gold)" }}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-1)" }}>
              {song.notes}
            </p>
          </div>
        </div>
      )}

      {/* ── Validation ── */}
      <SongValidationBar
        songId={id}
        status={(song.validation_status as any) ?? "brouillon"}
        rejectionNote={song.rejection_note}
        isChef={isChef}
      />

      {/* ── CTA Enrichir ── */}
      <Link href={`/chants/${id}/modifier`}
        className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--gold-dim)" }}>
          <Edit2 className="w-4 h-4" style={{ color: "var(--gold)" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Enrichir ce chant</p>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>
            Paroles · Guides vocaux · YouTube · Tonalité
          </p>
        </div>
        <Edit2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
      </Link>
    </div>
  );
}
