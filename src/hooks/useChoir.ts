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

  async function fetch() {
    setLoading(true);
    setError(null);
    try {
      const res = await window.fetch("/api/choir");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChoir(data.choir);
      setRole(data.role ?? null);
      setMembers(data.members ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetch(); }, []);

  return { choir, role, members, loading, error, refetch: fetch };
}
