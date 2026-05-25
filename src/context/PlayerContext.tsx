"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type Track = {
  id: string;
  title: string;
  liturgical_type?: string | null;
  composer?: string | null;
};

type PlayerCtx = {
  track: Track | null;
  isPlaying: boolean;
  speed: number;
  voice: string | null;
  youtubeVideoId: string | null;
  play: (t: Track, videoId?: string | null) => void;
  pause: () => void;
  toggle: () => void;
  setSpeed: (s: number) => void;
  setVoice: (v: string | null) => void;
  clear: () => void;
};

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [track,          setTrack]          = useState<Track | null>(null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [speed,          setSpeed]          = useState(1);
  const [voice,          setVoice]          = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

  return (
    <Ctx.Provider value={{
      track, isPlaying, speed, voice, youtubeVideoId,
      play:   (t, videoId = null) => {
        setTrack(t);
        setIsPlaying(true);
        setYoutubeVideoId(videoId ?? null);
      },
      pause:  () => setIsPlaying(false),
      toggle: () => setIsPlaying((p) => !p),
      setSpeed,
      setVoice,
      clear:  () => {
        setTrack(null);
        setIsPlaying(false);
        setYoutubeVideoId(null);
        setVoice(null);
      },
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be inside PlayerProvider");
  return ctx;
}
