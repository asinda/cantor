"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LITURGICAL_SEASONS, LITURGICAL_GRADIENTS, LITURGICAL_TYPE_VALUES } from "@/types";
import { Plus, X, GripVertical } from "lucide-react";

type SongRow = { id: string; title: string; liturgical_type: string | null; key_signature: string | null };
type OrderEntry = { song_id: string; position: number; notes?: string };
type Initial = { id: string; title: string; date?: string | null; liturgical_season?: string | null; notes?: string | null; initialOrder?: OrderEntry[] };

type Props = { choirId: string; songs: SongRow[]; initial?: Initial };

const ORDER_LABELS = LITURGICAL_TYPE_VALUES;

export default function MasseForm({ choirId, songs, initial }: Props) {
  const router  = useRouter();
  const [title,   setTitle]   = useState(initial?.title ?? "");
  const [date,    setDate]    = useState(initial?.date?.slice(0, 10) ?? "");
  const [season,  setSeason]  = useState(initial?.liturgical_season ?? "");
  const [notes,   setNotes]   = useState(initial?.notes ?? "");
  const [order,   setOrder]   = useState<OrderEntry[]>(initial?.initialOrder ?? []);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;

  function addSong(songId: string) {
    if (order.find((e) => e.song_id === songId)) return;
    setOrder((prev) => [...prev, { song_id: songId, position: prev.length + 1 }]);
  }

  function removeEntry(songId: string) {
    setOrder((prev) => prev.filter((e) => e.song_id !== songId).map((e, i) => ({ ...e, position: i + 1 })));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    let sheetId: string;

    if (initial?.id) {
      const { error: err } = await supabase.from("mass_sheets").update({
        title: title.trim(), date: date || null, liturgical_season: season || null, notes: notes || null,
      }).eq("id", initial.id);
      if (err) { setError(err.message); setLoading(false); return; }
      await supabase.from("mass_sheet_songs").delete().eq("mass_sheet_id", initial.id);
      sheetId = initial.id;
    } else {
      const { data: sheet, error: err } = await supabase
        .from("mass_sheets")
        .insert({ choir_id: choirId, title: title.trim(), date: date || null, liturgical_season: season || null, notes: notes || null })
        .select("id").single();
      if (err || !sheet) { setError(err?.message ?? "Erreur"); setLoading(false); return; }
      sheetId = sheet.id;
    }

    if (order.length > 0) {
      await supabase.from("mass_sheet_songs").insert(
        order.map((e) => ({ mass_sheet_id: sheetId, song_id: e.song_id, position: e.position }))
      );
    }

    router.push(`/messe/${sheetId}`);
  }

  const selectedIds = new Set(order.map((e) => e.song_id));

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Info */}
      <div className="card space-y-4">
        <h2 className="font-bold text-sm text-white">Informations</h2>
        <div>
          <label>Titre *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Messe du 1er dimanche de l'Avent" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label>Temps liturgique</label>
            <select value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {LITURGICAL_SEASONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Thème, instructions…" rows={2} />
        </div>
      </div>

      {/* Programme */}
      <div className="card space-y-3">
        <h2 className="font-bold text-sm text-white">Programme ({order.length} chants)</h2>

        {/* Selected order */}
        {order.length > 0 && (
          <div className="space-y-2">
            {order.map((entry, idx) => {
              const song = songs.find((s) => s.id === entry.song_id);
              if (!song) return null;
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)";
              return (
                <div key={entry.song_id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <GripVertical className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "var(--violet)", minWidth: 20 }}>
                    {idx + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg flex-shrink-0"
                    style={{ background: grad }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                    <p className="text-xs" style={{ color: "var(--text-2)" }}>
                      {[song.liturgical_type, song.key_signature].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeEntry(entry.song_id)}
                    className="p-1 rounded-lg flex-shrink-0 transition-colors"
                    style={{ color: "var(--text-3)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add songs by liturgical type */}
        {ORDER_LABELS.map((ltype) => {
          const typeSongs = songs.filter((s) => s.liturgical_type === ltype);
          if (typeSongs.length === 0) return null;
          return (
            <div key={ltype}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2"
                style={{ color: "var(--text-3)" }}>
                {ltype}
              </p>
              <div className="space-y-1">
                {typeSongs.map((song) => (
                  <button key={song.id} type="button"
                    onClick={() => addSong(song.id)}
                    disabled={selectedIds.has(song.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors disabled:opacity-40"
                    style={{ background: "var(--surface-2)" }}>
                    <div className="w-7 h-7 rounded-lg flex-shrink-0"
                      style={{ background: GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)" }} />
                    <span className="text-sm text-white flex-1 truncate">{song.title}</span>
                    {!selectedIds.has(song.id) && (
                      <Plus className="w-4 h-4 flex-shrink-0" style={{ color: "#7F77DD" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {songs.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-2)" }}>
            Aucun chant dans le répertoire.{" "}
            <a href="/chants/nouveau" className="font-semibold" style={{ color: "#7F77DD" }}>
              Ajouter un chant
            </a>
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
          {loading ? "Enregistrement…" : initial?.id ? "Enregistrer" : "Créer la feuille"}
        </button>
      </div>
    </form>
  );
}
