"use client";
import { useState, useEffect } from "react";

export type Song = {
  id: string;
  title: string;
  liturgical_type: string | null;
  liturgical_season: string | null;
  status: string | null;
  difficulty: string | null;
  languages: string[] | null;
  key_signature: string | null;
  tempo_bpm: number | null;
  composer: string | null;
  updated_at: string;
};

export function useSongs() {
  const [songs,   setSongs]   = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function fetch() {
    setLoading(true); setError(null);
    try {
      const res = await window.fetch("/api/chants");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSongs(data.songs ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  return { songs, loading, error, refetch: fetch };
}
