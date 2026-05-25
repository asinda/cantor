"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LITURGICAL_TYPE_VALUES, LITURGICAL_SEASONS, MUSICAL_KEYS,
  SONG_STATUSES, DIFFICULTIES, LANGUAGE_LABELS,
} from "@/types";
import { ExternalLink, Loader2, Plus, X, Mic2, FileText } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type YouTubeEntry = {
  url: string; title: string; channel: string;
  video_id: string; version_type: string; thumbnail?: string;
};

type LyricState = { text: string; phonetic: string };

type VoiceGuideLocal = { starting_note: string; entry_seconds: string; instructions: string };

const VOICE_KEYS = ["soprano", "alto", "tenor", "basse"] as const;

const VOICE_UI: Record<string, { label: string; short: string; color: string }> = {
  soprano: { label: "Soprano", short: "S", color: "#f472b6" },
  alto:    { label: "Alto",    short: "A", color: "#fb923c" },
  tenor:   { label: "Ténor",   short: "T", color: "#60a5fa" },
  basse:   { label: "Basse",   short: "B", color: "#4ade80" },
};

type Props = { choirId: string; initial?: any };

// ── Composant ──────────────────────────────────────────────────

export default function SongForm({ choirId, initial }: Props) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  // Champs de base
  const [title,    setTitle]    = useState(initial?.title ?? "");
  const [composer, setComposer] = useState(initial?.composer ?? "");
  const [type,     setType]     = useState(initial?.liturgical_type ?? "");
  const [season,   setSeason]   = useState(initial?.liturgical_season ?? "");
  const [key,      setKey]      = useState(initial?.key_signature ?? "");
  const [bpm,      setBpm]      = useState<string>(String(initial?.tempo_bpm ?? ""));
  const [diff,     setDiff]     = useState(initial?.difficulty ?? "moyen");
  const [status,   setStatus]   = useState(initial?.status ?? "nouveau");
  const [notes,    setNotes]    = useState(initial?.notes ?? "");
  const [langs,    setLangs]    = useState<string[]>(initial?.languages ?? ["fr"]);

  // Paroles — une entrée par langue
  const [lyricsMap, setLyricsMap] = useState<Record<string, LyricState>>(() => {
    const map: Record<string, LyricState> = {};
    (initial?.lyrics ?? []).forEach((l: any) => {
      map[l.language] = { text: l.lyrics ?? "", phonetic: l.phonetic ?? "" };
    });
    return map;
  });

  // Guides vocaux — un par voix
  const [guidesMap, setGuidesMap] = useState<Record<string, VoiceGuideLocal>>(() => {
    const map: Record<string, VoiceGuideLocal> = {};
    (initial?.voice_guides ?? []).forEach((g: any) => {
      map[g.voice_part] = {
        starting_note: g.starting_note ?? "",
        entry_seconds: String(g.entry_seconds ?? ""),
        instructions:  g.instructions ?? "",
      };
    });
    return map;
  });

  // YouTube
  const [ytUrl,      setYtUrl]      = useState("");
  const [ytFetching, setYtFetching] = useState(false);
  const [ytError,    setYtError]    = useState("");
  const [ytLinks,    setYtLinks]    = useState<YouTubeEntry[]>(
    (initial?.youtube_links ?? []).map((l: any) => ({
      url:          l.url,
      title:        l.title ?? "",
      channel:      l.channel ?? "",
      video_id:     l.video_id ?? "",
      version_type: l.version_type ?? "choral",
      thumbnail:    l.thumbnail ?? undefined,
    }))
  );

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  // ── Helpers ──────────────────────────────────────────────────

  function toggleLang(lang: string) {
    setLangs((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]);
  }

  function setLyric(lang: string, field: keyof LyricState, value: string) {
    setLyricsMap((prev) => {
      const cur = prev[lang] ?? { text: "", phonetic: "" };
      return { ...prev, [lang]: { ...cur, [field]: value } };
    });
  }

  function setGuide(voice: string, field: keyof VoiceGuideLocal, value: string) {
    setGuidesMap((prev) => {
      const cur = prev[voice] ?? { starting_note: "", entry_seconds: "", instructions: "" };
      return { ...prev, [voice]: { ...cur, [field]: value } };
    });
  }

  async function fetchYoutube() {
    if (!ytUrl.trim()) return;
    setYtFetching(true); setYtError("");
    try {
      const res  = await fetch(`/api/youtube?url=${encodeURIComponent(ytUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "URL invalide");
      if (ytLinks.find((l) => l.video_id === data.video_id)) {
        setYtError("Ce lien est déjà ajouté."); return;
      }
      setYtLinks((prev) => [...prev, { ...data, url: ytUrl.trim(), version_type: "choral" }]);
      setYtUrl("");
    } catch (e: any) {
      setYtError(e.message);
    } finally {
      setYtFetching(false);
    }
  }

  function removeYt(videoId: string) {
    setYtLinks((prev) => prev.filter((l) => l.video_id !== videoId));
  }

  // ── Soumission ────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Le titre est requis."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    const payload = {
      title:             title.trim(),
      choir_id:          choirId,
      composer:          composer || null,
      liturgical_type:   type || null,
      liturgical_season: season || null,
      key_signature:     key || null,
      tempo_bpm:         bpm ? Number(bpm) : null,
      difficulty:        diff || null,
      status,
      notes:             notes || null,
      languages:         langs,
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

    if (!id) { setLoading(false); return; }

    // Sync YouTube
    if (isEdit) await supabase.from("youtube_links").delete().eq("song_id", id);
    if (ytLinks.length > 0) {
      await supabase.from("youtube_links").insert(
        ytLinks.map((l, i) => ({
          song_id:      id,
          url:          l.url,
          video_id:     l.video_id,
          title:        l.title,
          channel:      l.channel,
          thumbnail:    l.thumbnail ?? `https://img.youtube.com/vi/${l.video_id}/mqdefault.jpg`,
          version_type: l.version_type,
          is_primary:   i === 0,
        }))
      );
    }

    // Sync paroles
    if (isEdit) await supabase.from("song_lyrics").delete().eq("song_id", id);
    const lyricsRows = langs
      .filter((lang) => lyricsMap[lang]?.text.trim())
      .map((lang) => ({
        song_id:  id,
        language: lang,
        lyrics:   lyricsMap[lang].text.trim(),
        phonetic: lyricsMap[lang].phonetic.trim() || null,
      }));
    if (lyricsRows.length > 0) await supabase.from("song_lyrics").insert(lyricsRows);

    // Sync guides vocaux
    if (isEdit) await supabase.from("voice_guides").delete().eq("song_id", id);
    const guideRows = VOICE_KEYS
      .filter((v) => guidesMap[v]?.starting_note.trim() || guidesMap[v]?.instructions.trim())
      .map((v) => ({
        song_id:       id,
        voice_part:    v,
        starting_note: guidesMap[v].starting_note.trim() || null,
        entry_seconds: guidesMap[v].entry_seconds ? Number(guidesMap[v].entry_seconds) : null,
        instructions:  guidesMap[v].instructions.trim() || null,
      }));
    if (guideRows.length > 0) await supabase.from("voice_guides").insert(guideRows);

    router.push(`/chants/${id}`);
  }

  // ── JSX ───────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Informations de base */}
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

      {/* Paramètres musicaux */}
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
            <button key={code} type="button" onClick={() => toggleLang(code)}
              className={`chip ${langs.includes(code) ? "chip-on" : "chip-off"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Paroles */}
      {langs.length > 0 && (
        <div className="card space-y-5">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: "#1D9E75" }} />
            <h2 className="font-bold text-sm text-white">Paroles</h2>
          </div>
          {langs.map((lang) => {
            const label = LANGUAGE_LABELS[lang as keyof typeof LANGUAGE_LABELS] ?? lang.toUpperCase();
            const entry = lyricsMap[lang] ?? { text: "", phonetic: "" };
            return (
              <div key={lang} className="space-y-2">
                <span className="text-xs px-2.5 py-1 rounded-lg font-bold uppercase inline-block"
                  style={{ background: "rgba(29,158,117,0.15)", color: "#1D9E75" }}>
                  {label}
                </span>
                <textarea
                  value={entry.text}
                  onChange={(e) => setLyric(lang, "text", e.target.value)}
                  placeholder={`Paroles en ${label} — couplets, refrain…`}
                  rows={6}
                  style={{ fontFamily: "monospace", fontSize: "0.82rem", lineHeight: 1.7 }}
                />
                <input
                  value={entry.phonetic}
                  onChange={(e) => setLyric(lang, "phonetic", e.target.value)}
                  placeholder="Guide de prononciation (optionnel)"
                  style={{ fontSize: "0.8rem" }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Guides vocaux S/A/T/B */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Mic2 className="w-4 h-4" style={{ color: "#7F77DD" }} />
          <h2 className="font-bold text-sm text-white">Guides vocaux</h2>
          <span className="text-xs" style={{ color: "var(--text-3)" }}>— note de départ par pupitre</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {VOICE_KEYS.map((v) => {
            const ui = VOICE_UI[v];
            const g  = guidesMap[v] ?? { starting_note: "", entry_seconds: "", instructions: "" };
            return (
              <div key={v} className="rounded-xl p-3 space-y-2"
                style={{ background: "var(--surface-2)", border: `1px solid ${ui.color}28` }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0"
                    style={{ background: `${ui.color}20`, color: ui.color }}>
                    {ui.short}
                  </div>
                  <p className="text-xs font-bold text-white">{ui.label}</p>
                </div>
                <input
                  value={g.starting_note}
                  onChange={(e) => setGuide(v, "starting_note", e.target.value)}
                  placeholder="Note de départ (ex: Sol4)"
                  style={{ fontSize: "0.78rem" }}
                />
                <input
                  type="number"
                  value={g.entry_seconds}
                  onChange={(e) => setGuide(v, "entry_seconds", e.target.value)}
                  placeholder="Entrée en secondes"
                  min={0}
                  style={{ fontSize: "0.78rem" }}
                />
                <textarea
                  value={g.instructions}
                  onChange={(e) => setGuide(v, "instructions", e.target.value)}
                  placeholder="Instructions, nuances…"
                  rows={2}
                  style={{ fontSize: "0.78rem" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* YouTube */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" style={{ color: "#FF4444" }} />
          <h2 className="font-bold text-sm text-white">Liens YouTube</h2>
        </div>

        {ytLinks.length > 0 && (
          <div className="space-y-2">
            {ytLinks.map((l) => (
              <div key={l.video_id}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                <img src={l.thumbnail || `https://img.youtube.com/vi/${l.video_id}/mqdefault.jpg`}
                  alt="" className="w-14 h-10 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{l.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{l.channel}</p>
                </div>
                <select value={l.version_type}
                  onChange={(e) => setYtLinks((prev) => prev.map((x) =>
                    x.video_id === l.video_id ? { ...x, version_type: e.target.value } : x
                  ))}
                  className="text-xs flex-shrink-0" style={{ width: "auto", padding: "0.3rem 0.5rem" }}>
                  {["choral","karaoke","satb","soprano","alto","tenor","basse","instrumental"].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
                <button type="button" onClick={() => removeYt(l.video_id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ color: "var(--text-3)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); fetchYoutube(); } }}
            style={{ flex: 1 }} />
          <button type="button" onClick={fetchYoutube} disabled={ytFetching || !ytUrl.trim()}
            className="btn btn-secondary flex-shrink-0" style={{ padding: "0 1rem" }}>
            {ytFetching ? <Loader2 className="w-4 h-4 spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
        {ytError && <p className="text-xs" style={{ color: "#f87171" }}>{ytError}</p>}
      </div>

      {/* Notes chef de chœur */}
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
