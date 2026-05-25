"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LITURGICAL_GRADIENTS } from "@/types";
import { Plus, X } from "lucide-react";

type SongRow = { id: string; title: string; liturgical_type: string | null; status: string | null };
type Initial = { id: string; date: string; notes?: string | null; initialPicked?: string[] };
type Props   = { choirId: string; songs: SongRow[]; initial?: Initial };

export default function RehearsalForm({ choirId, songs, initial }: Props) {
  const router    = useRouter();
  const [date,    setDate]    = useState(initial?.date?.slice(0, 16) ?? "");
  const [notes,   setNotes]   = useState(initial?.notes ?? "");
  const [picked,  setPicked]  = useState<string[]>(initial?.initialPicked ?? []);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;

  function toggleSong(id: string) {
    setPicked((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { setError("La date est requise."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    let rehearsalId: string;

    if (initial?.id) {
      const { error: err } = await supabase.from("rehearsals").update({ date, notes: notes || null }).eq("id", initial.id);
      if (err) { setError(err.message); setLoading(false); return; }
      await supabase.from("rehearsal_songs").delete().eq("rehearsal_id", initial.id);
      rehearsalId = initial.id;
    } else {
      const { data: rehearsal, error: err } = await supabase
        .from("rehearsals").insert({ choir_id: choirId, date, notes: notes || null }).select("id").single();
      if (err || !rehearsal) { setError(err?.message ?? "Erreur"); setLoading(false); return; }
      rehearsalId = rehearsal.id;
    }

    if (picked.length > 0) {
      await supabase.from("rehearsal_songs").insert(
        picked.map((song_id, i) => ({ rehearsal_id: rehearsalId, song_id, order_index: i + 1 }))
      );
    }

    router.push(`/repetitions/${rehearsalId}`);
  }

  const pickedSet = new Set(picked);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      <div className="card space-y-4">
        <h2 className="font-bold text-sm text-white">Date et notes</h2>
        <div>
          <label>Date *</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label>Notes (lieu, thème…)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Salle paroissiale, accent sur les chants de Noël…" rows={3} />
        </div>
      </div>

      {/* Chants au programme */}
      <div className="card space-y-3">
        <h2 className="font-bold text-sm text-white">Chants au programme</h2>

        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {picked.map((id) => {
              const s = songs.find((s) => s.id === id);
              return (
                <span key={id}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--violet-dim)", color: "#7F77DD" }}>
                  {s?.title}
                  <button type="button" onClick={() => toggleSong(id)}
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(127,119,221,0.3)" }}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        <div className="space-y-1 max-h-64 overflow-y-auto">
          {songs.map((song) => (
            <button key={song.id} type="button"
              onClick={() => toggleSong(song.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
              style={{
                background: pickedSet.has(song.id) ? "var(--violet-dim)" : "var(--surface-2)",
                border: `1px solid ${pickedSet.has(song.id) ? "rgba(127,119,221,0.3)" : "var(--border)"}`,
              }}>
              <div className="w-7 h-7 rounded-lg flex-shrink-0"
                style={{ background: GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)" }} />
              <span className="text-sm flex-1 truncate"
                style={{ color: pickedSet.has(song.id) ? "#7F77DD" : "var(--text-1)" }}>
                {song.title}
              </span>
              {pickedSet.has(song.id)
                ? <X className="w-4 h-4 flex-shrink-0" style={{ color: "#7F77DD" }} />
                : <Plus className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
              }
            </button>
          ))}
        </div>

        {songs.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-2)" }}>
            Aucun chant dans le répertoire.
          </p>
        )}
      </div>

      {error && (
        <div className="text-sm rounded-xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={() => router.back()} className="btn btn-secondary flex-1 justify-center">
          Annuler
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
          {loading ? "Enregistrement…" : initial?.id ? "Enregistrer" : "Planifier"}
        </button>
      </div>
    </form>
  );
}
