"use client";
import { useState, useEffect } from "react";

export type ChoirMember = {
  id: string;
  user_id: string;
  role: string;
  voice: string | null;
  joined_at: string;
};

export type Choir = {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  owner_id: string;
  logo_url: string | null;
  city: string | null;
  created_at: string;
};

export type ChoirData = {
  choir: Choir | null;
  role: string | null;
  members: ChoirMember[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useChoir(): ChoirData {
  const [choir,   setChoir]   = useState<Choir | null>(null);
  const [role,    setRole]    = useState<string | null>(null);
  const [members, setMembers] = useState<ChoirMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  async function refetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch("/api/choir");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChoir(data.choir);
      setRole(data.role ?? null);
      setMembers(data.members ?? []);
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
        const res = await window.fetch("/api/choir");
        const data = await res.json();
        if (!active) return;
        if (!res.ok) throw new Error(data.error);
        setChoir(data.choir);
        setRole(data.role ?? null);
        setMembers(data.members ?? []);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return { choir, role, members, loading, error, refetch };
}
