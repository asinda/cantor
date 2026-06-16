"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRehearsalAction, updateRehearsalAction } from "@/actions/repetitions";
import { LITURGICAL_GRADIENTS } from "@/types";
import { Plus, X, MapPin, Clock, Calendar, FileText } from "lucide-react";

type SongRow = { id: string; title: string; liturgical_type: string | null; status: string | null };
type Initial  = {
  id: string;
  date: string;
  time?: string | null;
  location?: string | null;
  notes?: string | null;
  initialPicked?: string[];
};
type Props = { choirId: string; songs: SongRow[]; initial?: Initial };

export default function RehearsalForm({ choirId, songs, initial }: Props) {
  const router = useRouter();

  const [date,     setDate]     = useState(initial?.date?.slice(0, 10) ?? "");
  const [time,     setTime]     = useState(initial?.time ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [notes,    setNotes]    = useState(initial?.notes ?? "");
  const [picked,   setPicked]   = useState<string[]>(initial?.initialPicked ?? []);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const pickedSet  = new Set(picked);
  const filteredSongs = songs.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  function toggleSong(id: string) {
    setPicked(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) { setError("La date est requise."); return; }
    setLoading(true); setError("");

    const payload = {
      choir_id: choirId,
      date,
      time:     time     || null,
      location: location || null,
      notes:    notes    || null,
      song_ids: picked,
    };

    const result = initial?.id
      ? await updateRehearsalAction(initial.id, payload)
      : await createRehearsalAction(payload);

    if ("error" in result) { setError(result.error); setLoading(false); return; }
    router.push(`/repetitions/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Informations ── */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2" style={{ color: "var(--text-1)" }}>
          <Calendar className="w-4 h-4" style={{ color: "var(--gold)" }} />
          Informations
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label>Date *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
          </div>
          <div>
            <label>Heure</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--text-3)" }} />
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="pl-9" />
            </div>
          </div>
        </div>

        <div>
          <label>Lieu</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--text-3)" }} />
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Salle paroissiale, église Saint-Joseph…"
              className="pl-9" />
          </div>
        </div>

        <div>
          <label>Notes</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 pointer-events-none"
              style={{ color: "var(--text-3)" }} />
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Thème, objectifs, remarques…"
              rows={3} className="pl-9" />
          </div>
        </div>
      </div>

      {/* ── Chants au programme ── */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
            Chants au programme
          </h2>
          {picked.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
              {picked.length} sélectionné{picked.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Sélectionnés */}
        {picked.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
            {picked.map(id => {
              const s = songs.find(s => s.id === id);
              if (!s) return null;
              return (
                <span key={id}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold"
                  style={{ background: "var(--gold-dim)", color: "var(--gold)",
                    border: "1px solid var(--gold-border)" }}>
                  {s.title}
                  <button type="button" onClick={() => toggleSong(id)}
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(160,98,26,0.2)" }}>
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Recherche */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer les chants…"
        />

        {/* Liste */}
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {filteredSongs.length === 0 ? (
            <p className="text-sm text-center py-4" style={{ color: "var(--text-2)" }}>
              {songs.length === 0 ? "Aucun chant dans le répertoire." : "Aucun résultat."}
            </p>
          ) : filteredSongs.map(song => (
            <button key={song.id} type="button" onClick={() => toggleSong(song.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
              style={{
                background: pickedSet.has(song.id) ? "var(--gold-dim)" : "var(--surface-2)",
                border: `1px solid ${pickedSet.has(song.id) ? "var(--gold-border)" : "var(--border)"}`,
              }}>
              <div className="w-7 h-7 rounded-md flex-shrink-0"
                style={{ background: GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#5C3200,#A0621A)" }} />
              <span className="text-sm flex-1 truncate"
                style={{ color: pickedSet.has(song.id) ? "var(--gold)" : "var(--text-1)" }}>
                {song.title}
              </span>
              {pickedSet.has(song.id)
                ? <X    className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
                : <Plus className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
              }
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="text-sm rounded-xl px-4 py-3"
          style={{ background: "rgba(192,57,43,0.08)", color: "var(--red)",
            border: "1px solid rgba(192,57,43,0.2)" }}>
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
