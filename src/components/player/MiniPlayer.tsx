"use client";
import { useEffect, useRef } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { Play, Pause, X, Music } from "lucide-react";
import { LITURGICAL_GRADIENTS } from "@/types";
import Link from "next/link";

const SPEEDS = [0.5, 0.75, 1, 1.25];

const VOICE_COLORS: Record<string, string> = {
  soprano: "#f472b6", alto: "#fb923c", tenor: "#60a5fa", basse: "#4ade80",
};

const BARS = Array.from({ length: 24 }, (_, i) => ({
  h: 8 + Math.abs(Math.sin(i * 0.7) * 22),
  delay: i * 0.04,
}));

export default function MiniPlayer() {
  const { track, isPlaying, speed, voice, youtubeVideoId, toggle, setSpeed, clear, pause } = usePlayer();

  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef    = useRef<any>(null);
  const ytReadyRef     = useRef(false);
  const speedRef       = useRef(speed);
  const clearRef       = useRef(clear);
  const pauseRef       = useRef(pause);

  // Keep refs up-to-date
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { clearRef.current = clear; }, [clear]);
  useEffect(() => { pauseRef.current = pause; }, [pause]);

  // ── Gérer le cycle de vie du lecteur YouTube ────────────────
  useEffect(() => {
    if (!youtubeVideoId) {
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
      ytReadyRef.current  = false;
      return;
    }

    let destroyed = false;

    function createPlayer() {
      if (destroyed || !ytContainerRef.current) return;
      ytContainerRef.current.innerHTML = ""; // vider le conteneur

      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
        videoId: youtubeVideoId,
        width: 1,
        height: 1,
        playerVars: { controls: 0, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: () => {
            if (destroyed) return;
            ytReadyRef.current = true;
            ytPlayerRef.current.setPlaybackRate(speedRef.current);
            ytPlayerRef.current.playVideo();
          },
          onStateChange: (e: any) => {
            if (destroyed) return;
            if (e.data === 0) clearRef.current(); // ENDED
          },
          onError: () => { if (!destroyed) clearRef.current(); },
        },
      });
    }

    function loadAndCreate() {
      if ((window as any).YT?.Player) {
        createPlayer();
      } else {
        // Chaîner sur un callback potentiellement déjà défini
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => { prev?.(); createPlayer(); };

        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const s = document.createElement("script");
          s.src = "https://www.youtube.com/iframe_api";
          document.head.appendChild(s);
        }
      }
    }

    loadAndCreate();

    return () => {
      destroyed = true;
      ytPlayerRef.current?.destroy();
      ytPlayerRef.current = null;
      ytReadyRef.current  = false;
    };
  }, [youtubeVideoId]);

  // ── Synchroniser play / pause ───────────────────────────────
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReadyRef.current) return;
    try {
      if (isPlaying) ytPlayerRef.current.playVideo();
      else           ytPlayerRef.current.pauseVideo();
    } catch {}
  }, [isPlaying]);

  // ── Synchroniser la vitesse ─────────────────────────────────
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReadyRef.current) return;
    try { ytPlayerRef.current.setPlaybackRate(speed); } catch {}
  }, [speed]);

  // Conteneur YouTube invisible — toujours dans le DOM
  const ytContainer = (
    <div
      ref={ytContainerRef}
      style={{ position: "fixed", top: 0, left: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none", zIndex: -1 }}
    />
  );

  if (!track) return ytContainer;

  const GRAD      = LITURGICAL_GRADIENTS as Record<string, string>;
  const grad      = GRAD[track.liturgical_type ?? ""] ?? "linear-gradient(135deg,#C9A227,#7F77DD)";
  const voiceColor = voice ? (VOICE_COLORS[voice] ?? "var(--gold)") : "var(--gold)";
  const hasYt     = !!youtubeVideoId;

  return (
    <>
      {ytContainer}
      <div className="mini-player no-print">
        <div className="mini-player-inner">

          {/* Cover + titre */}
          <Link href={`/chants/${track.id}`} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-xl flex-shrink-0 cover-art relative overflow-hidden"
              style={{ background: grad }}>
              {hasYt ? (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.4)" }}>
                  {/* Petit logo YouTube */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#FF4444">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              ) : (
                <Music className="w-4 h-4 text-white/60 m-auto" style={{ marginTop: "50%", transform: "translateY(-50%)" }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">{track.title}</p>
              <p className="text-xs truncate mt-0.5">
                {voice
                  ? <span style={{ color: voiceColor }}>Voix : {voice}</span>
                  : <span style={{ color: hasYt ? "#FF4444" : "var(--gold)" }}>
                      {hasYt ? "YouTube" : (track.composer ?? track.liturgical_type ?? "Chant")}
                    </span>
                }
              </p>
            </div>
          </Link>

          {/* Waveform */}
          <div className={`hidden sm:flex items-center gap-px flex-shrink-0 ${isPlaying ? "wave-playing" : ""}`}
            style={{ height: 32 }}>
            {BARS.map((b, i) => (
              <div key={i} className="waveform-bar-mini"
                style={{
                  height: `${b.h}px`,
                  width: 2,
                  borderRadius: 99,
                  background: isPlaying ? voiceColor : "rgba(255,255,255,0.15)",
                  animationDelay: `${b.delay}s`,
                }} />
            ))}
          </div>

          {/* Vitesse */}
          <div className="hidden md:flex items-center gap-1 flex-shrink-0">
            {SPEEDS.map((s) => (
              <button key={s} onClick={() => setSpeed(s)}
                className={`speed-btn ${speed === s ? "speed-btn-on" : "speed-btn-off"}`}>
                {s}×
              </button>
            ))}
          </div>

          {/* Play / Pause */}
          <button onClick={toggle}
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            style={{ background: hasYt ? "#FF4444" : "var(--gold)" }}>
            {isPlaying
              ? <Pause className="w-4 h-4 fill-current" style={{ color: "#fff" }} />
              : <Play  className="w-4 h-4 fill-current ml-0.5" style={{ color: "#fff" }} />
            }
          </button>

          {/* Fermer */}
          <button onClick={clear}
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ color: "var(--text-3)" }}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
