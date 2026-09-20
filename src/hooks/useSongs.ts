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

  async function refetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch("/api/chants");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSongs(data.songs ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Chargement initial : inline (pas d'appel à une fonction externe) pour que
  // les mises à jour d'état restent bien des continuations après le "await",
  // et non des appels synchrones dans le corps de l'effet.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await window.fetch("/api/chants");
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error);
        setSongs(data.songs ?? []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { songs, loading, error, refetch };
}
