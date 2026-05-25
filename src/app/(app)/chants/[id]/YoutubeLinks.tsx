"use client";
import { usePlayer, Track } from "@/context/PlayerContext";
import { Play, Pause, ExternalLink } from "lucide-react";

type YtLink = {
  id: string;
  url: string;
  video_id: string | null;
  title: string | null;
  channel: string | null;
  thumbnail: string | null;
  version_type: string;
};

const VERSION_LABELS: Record<string, string> = {
  choral:       "Choral",
  karaoke:      "Karaoké",
  satb:         "SATB",
  soprano:      "Soprano",
  alto:         "Alto",
  tenor:        "Ténor",
  basse:        "Basse",
  instrumental: "Instrumental",
};

export default function YoutubeLinks({ links, track }: { links: YtLink[]; track: Track }) {
  const { play, pause, track: current, isPlaying, youtubeVideoId } = usePlayer();

  function handleClick(yt: YtLink) {
    if (!yt.video_id) return;
    const isActive = current?.id === track.id && youtubeVideoId === yt.video_id;
    if (isActive && isPlaying) { pause(); return; }
    play(track, yt.video_id);
  }

  return (
    <div className="space-y-2">
      {links.map((yt) => {
        const isActive  = current?.id === track.id && youtubeVideoId === yt.video_id;
        const playing   = isActive && isPlaying;
        const thumb     = yt.thumbnail ?? (yt.video_id ? `https://img.youtube.com/vi/${yt.video_id}/mqdefault.jpg` : null);
        const hasVideo  = !!yt.video_id;

        return (
          <div key={yt.id}
            className="flex items-center gap-3 p-3 rounded-xl transition-all"
            style={{
              background: isActive ? "rgba(255,68,68,0.08)" : "var(--surface-2)",
              border: `1px solid ${isActive ? "rgba(255,68,68,0.3)" : "var(--border)"}`,
            }}>

            {/* Thumbnail */}
            <div className="relative flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden"
              style={{ background: "var(--surface-3)" }}>
              {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
              {hasVideo && (
                <button
                  onClick={() => handleClick(yt)}
                  className="absolute inset-0 flex items-center justify-center transition-opacity"
                  style={{ background: playing ? "rgba(255,68,68,0.7)" : "rgba(0,0,0,0.45)" }}>
                  {playing
                    ? <Pause className="w-5 h-5 text-white fill-white" />
                    : <Play  className="w-5 h-5 text-white fill-white ml-0.5" />
                  }
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <button onClick={() => handleClick(yt)} className="text-left w-full" disabled={!hasVideo}>
                <p className="text-sm font-semibold text-white truncate leading-tight">
                  {yt.title || yt.url}
                </p>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>
                  {yt.channel && <span>{yt.channel} · </span>}
                  <span className="font-semibold" style={{ color: isActive ? "#FF4444" : "var(--text-3)" }}>
                    {VERSION_LABELS[yt.version_type] ?? yt.version_type}
                  </span>
                </p>
              </button>
            </div>

            {/* Lien externe */}
            <a href={yt.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded-lg flex-shrink-0 transition-colors"
              style={{ color: "var(--text-3)" }}
              onClick={(e) => e.stopPropagation()}
              title="Ouvrir sur YouTube">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        );
      })}
    </div>
  );
}
