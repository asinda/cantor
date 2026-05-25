"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LITURGICAL_TYPE_VALUES, LITURGICAL_SEASONS, MUSICAL_KEYS,
  SONG_STATUSES, DIFFICULTIES, LANGUAGE_LABELS,
} from "@/types";

type Props = { choirId: string; initial?: any };

export default function SongForm({ choirId, initial }: Props) {
  const router  = useRouter();
  const isEdit  = !!initial?.id;

  const [title,    setTitle]    = useState(initial?.title ?? "");
  const [composer, setComposer] = useState(initial?.composer ?? "");
  const [type,     setType]     = useState(initial?.liturgical_type ?? "");
  const [season,   setSeason]   = useState(initial?.liturgical_season ?? "");
  const [key,      setKey]      = useState(initial?.key_signature ?? "");
  const [bpm,      setBpm]      = useState(initial?.bpm ?? "");
  const [diff,     setDiff]     = useState(initial?.difficulty ?? "moyen");
  const [status,   setStatus]   = useState(initial?.status ?? "nouveau");
  const [notes,    setNotes]    = useState(initial?.notes ?? "");
  const [langs,    setLangs]    = useState<string[]>(initial?.languages ?? ["fr"]);

  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState("");

  function toggleLang(lang: string) {
    setLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    const payload = {
      title: title.trim(),
      choir_id: choirId,
      composer: composer || null,
      liturgical_type: type || null,
      liturgical_season: season || null,
      key_signature: key || null,
      bpm: bpm ? Number(bpm) : null,
      difficulty: diff || null,
      status,
      notes: notes || null,
      languages: langs,
    };

    let id = initial?.id;
    if (isEdit) {
      const { error: err } = await supabase.from("songs").update(payload).eq("id", id);
      if (err) { setError(err.message); setLoading(false); return; }
    } else {
      const { data, error: err } = await supabase.from("songs").insert(payload).select("id").single();
      if (err) { setError(err.message); setLoading(false); return; }
      id = data?.id;
    }

    router.push(`/chants/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Titre */}
      <div className="card space-y-4">
        <h2 className="font-bold text-sm text-white">Informations de base</h2>
        <div>
          <label>Titre *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du chant" required />
        </div>
        <div>
          <label>Compositeur / Auteur</label>
          <input value={composer} onChange={(e) => setComposer(e.target.value)}
            placeholder="Nom du compositeur" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Type liturgique</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {LITURGICAL_TYPE_VALUES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
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
      </div>

      {/* Musical */}
      <div className="card space-y-4">
        <h2 className="font-bold text-sm text-white">Paramètres musicaux</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Tonalité</label>
            <select value={key} onChange={(e) => setKey(e.target.value)}>
              <option value="">— Sélectionner —</option>
              {MUSICAL_KEYS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div>
            <label>BPM</label>
            <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)}
              placeholder="120" min={40} max={240} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label>Difficulté</label>
            <select value={diff} onChange={(e) => setDiff(e.target.value)}>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {SONG_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Langues */}
      <div className="card space-y-3">
        <h2 className="font-bold text-sm text-white">Langues disponibles</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(LANGUAGE_LABELS) as [string, string][]).map(([code, label]) => (
            <button key={code} type="button"
              onClick={() => toggleLang(code)}
              className={`chip ${langs.includes(code) ? "chip-on" : "chip-off"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <label>Notes (pour le chef de chœur)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes d'interprétation, nuances, remarques…" rows={4} />
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
          {loading ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le chant"}
        </button>
      </div>
    </form>
  );
}
