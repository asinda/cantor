"use client";
import { usePlayer, Track } from "@/context/PlayerContext";
import { Play, Pause, Gauge } from "lucide-react";

const VOICES = [
  { key: "soprano", label: "S", color: "#f472b6", bg: "rgba(244,114,182,0.15)" },
  { key: "alto",    label: "A", color: "#fb923c", bg: "rgba(251,146,60,0.15)" },
  { key: "tenor",   label: "T", color: "#60a5fa", bg: "rgba(96,165,250,0.15)" },
  { key: "basse",   label: "B", color: "#4ade80", bg: "rgba(74,222,128,0.15)" },
];

const SPEEDS = [0.5, 0.75, 1, 1.25];

type YtLink = { id: string; video_id: string | null; version_type: string };

type Props = {
  track: Track;
  voiceGuides?: Array<{ voice_part: string; starting_note?: string; instructions?: string }>;
  youtubeLinks?: YtLink[];
};

export default function VoiceTools({ track, voiceGuides = [], youtubeLinks = [] }: Props) {
  const { track: current, isPlaying, speed, voice, youtubeVideoId, play, pause, toggle, setSpeed, setVoice } = usePlayer();
  const isActive = current?.id === track.id;

  function handleVoiceClick(vKey: string) {
    const switching = voice !== vKey;
    setVoice(switching ? vKey : null);

    const ytLink = youtubeLinks.find((l) => l.version_type === vKey && l.video_id);
    if (ytLink) {
      if (switching || !isActive) {
        play(track, ytLink.video_id);
      } else if (isActive && youtubeVideoId === ytLink.video_id) {
        if (isPlaying) pause(); else play(track, ytLink.video_id);
      } else {
        play(track, ytLink.video_id);
      }
    } else {
      if (!isActive) play(track);
      else if (!isPlaying) toggle();
    }
  }

  function handlePlay() {
    if (!isActive) play(track);
    else toggle();
  }

  const guideMap = Object.fromEntries(voiceGuides.map((g) => [g.voice_part, g]));

  return (
    <div className="card-gold space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--gold-dim)" }}>
            <Gauge className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
          </div>
          <p className="font-bold text-sm text-white">Outils de répétition</p>
        </div>
        <span className="ai-badge">Choir Tools</span>
      </div>

      {/* Voice part selector */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--text-3)" }}>
          Voix — cliquer pour écouter
        </p>
        <div className="grid grid-cols-4 gap-2">
          {VOICES.map((v) => {
            const isSelected = voice === v.key && isActive;
            const guide = guideMap[v.key];
            return (
              <button key={v.key} type="button" onClick={() => handleVoiceClick(v.key)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all"
                style={{
                  background: isSelected ? v.bg : "var(--surface-2)",
                  border: `1px solid ${isSelected ? v.color + "50" : "var(--border)"}`,
                  boxShadow: isSelected ? `0 0 20px ${v.color}30` : "none",
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-base"
                  style={{ background: isSelected ? v.color + "30" : "var(--surface-3)", color: v.color }}>
                  {v.label}
                </div>
                <p className="text-xs font-semibold capitalize" style={{ color: isSelected ? v.color : "var(--text-2)" }}>
                  {v.key}
                </p>
                {guide?.starting_note && (
                  <span className="text-xs font-black" style={{ color: isSelected ? v.color : "var(--text-3)" }}>
                    {guide.starting_note}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Speed control */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
          Vitesse de lecture
        </p>
        <div className="flex items-center gap-2">
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`speed-btn flex-1 ${speed === s ? "speed-btn-on" : "speed-btn-off"}`}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Play/Pause global */}
      <button onClick={handlePlay}
        className="btn btn-primary w-full justify-center py-3 text-sm">
        {isActive && isPlaying
          ? <><Pause className="w-4 h-4 fill-current" /> Pause</>
          : <><Play  className="w-4 h-4 fill-current ml-0.5" /> Lancer la lecture</>
        }
      </button>
    </div>
  );
}
