"use client";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createSongAction, updateSongAction } from "@/actions/songs";
import {
  LITURGICAL_TYPE_VALUES, LITURGICAL_SEASONS, MUSICAL_KEYS,
  SONG_STATUSES, DIFFICULTIES, LANGUAGE_LABELS,
} from "@/types";
import {
  ExternalLink, Loader2, Plus, X, Mic2, FileText,
  Music, ChevronRight, CheckCircle, Info,
  Upload, Mic, Square, Sparkles, PlayCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────

type YouTubeEntry     = { url: string; title: string; channel: string; video_id: string; version_type: string; thumbnail?: string };
type LyricState       = { text: string; phonetic: string };
type VoiceGuideLocal  = { starting_note: string; entry_seconds: string; instructions: string };
type ChoirType        = "catholique" | "protestant" | "orthodoxe" | "autre" | "";
type Step             = "infos" | "paroles" | "voix" | "youtube";

const VOICE_KEYS = ["soprano", "alto", "tenor", "basse"] as const;

const VOICE_UI: Record<string, { label: string; short: string; color: string }> = {
  soprano: { label: "Soprano", short: "S", color: "#C2185B" },
  alto:    { label: "Alto",    short: "A", color: "#E65100" },
  tenor:   { label: "Ténor",   short: "T", color: "#1565C0" },
  basse:   { label: "Basse",   short: "B", color: "#2E7D32" },
};

const STEPS: { key: Step; label: string; icon: typeof Music }[] = [
  { key: "infos",   label: "Informations", icon: Music },
  { key: "paroles", label: "Paroles",       icon: FileText },
  { key: "voix",    label: "Guides vocaux", icon: Mic2 },
  { key: "youtube", label: "YouTube",       icon: ExternalLink },
];

const CHOIR_TYPES: { value: ChoirType; label: string }[] = [
  { value: "catholique",  label: "Catholique" },
  { value: "protestant",  label: "Protestant" },
  { value: "orthodoxe",   label: "Orthodoxe"  },
  { value: "autre",       label: "Autre"       },
];

// ── SpeechRecognition type ──
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

type Props = { choirId: string; initial?: any };

// ══ Composant principal ══════════════════════════════════════════

export default function SongForm({ choirId, initial }: Props) {
  const router  = useRouter();
  const isEdit  = !!initial?.id;

  const [step,       setStep]       = useState<Step>("infos");
  const [title,      setTitle]      = useState(initial?.title ?? "");
  const [composer,   setComposer]   = useState(initial?.composer ?? "");
  const [choirType,  setChoirType]  = useState<ChoirType>("");
  const [type,       setType]       = useState(initial?.liturgical_type ?? "");
  const [season,     setSeason]     = useState(initial?.liturgical_season ?? "");
  const [key,        setKey]        = useState(initial?.key_signature ?? "");
  const [bpm,        setBpm]        = useState<string>(String(initial?.tempo_bpm ?? ""));
  const [diff,       setDiff]       = useState(initial?.difficulty ?? "moyen");
  const [status,     setStatus]     = useState(initial?.status ?? "nouveau");
  const [notes,      setNotes]      = useState(initial?.notes ?? "");
  const [langs,      setLangs]      = useState<string[]>(initial?.languages ?? ["fr"]);
  const [activeLang, setActiveLang] = useState("fr");

  const [lyricsMap, setLyricsMap] = useState<Record<string, LyricState>>(() => {
    const map: Record<string, LyricState> = {};
    (initial?.lyrics ?? []).forEach((l: any) => {
      map[l.language] = { text: l.lyrics ?? "", phonetic: l.phonetic ?? "" };
    });
    return map;
  });

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

  const [ytUrl,      setYtUrl]      = useState("");
  const [ytFetching, setYtFetching] = useState(false);
  const [ytError,    setYtError]    = useState("");
  const [ytLinks,    setYtLinks]    = useState<YouTubeEntry[]>(
    (initial?.youtube_links ?? []).map((l: any) => ({
      url: l.url, title: l.title ?? "", channel: l.channel ?? "",
      video_id: l.video_id ?? "", version_type: l.version_type ?? "choral",
      thumbnail: l.thumbnail ?? undefined,
    }))
  );

  // ── États IA ──
  const [importing,   setImporting]   = useState(false);
  const [importError, setImportError] = useState("");
  const [recording,   setRecording]   = useState(false);
  const [ytTranscribing, setYtTranscribing] = useState(false);
  const [ytTranscriptUrl,  setYtTranscriptUrl]  = useState("");
  const [voiceDraft,       setVoiceDraft]        = useState<string | null>(null); // texte enregistré en attente
  const [addLangSelect,    setAddLangSelect]      = useState("");  // valeur du select "ajouter une langue"
  const [addLangCustom,    setAddLangCustom]      = useState("");  // saisie libre d'une langue personnalisée
  const [customLabels,     setCustomLabels]       = useState<Record<string, string>>({});  // code → label original

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // ── Helper : label lisible pour n'importe quel code de langue ──
  function getLangLabel(code: string): string {
    return LANGUAGE_LABELS[code as keyof typeof LANGUAGE_LABELS]
      ?? customLabels[code]
      ?? code.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  // ── Helpers ──

  function toggleLang(lang: string) {
    setLangs(prev => {
      if (prev.includes(lang)) {
        const next = prev.filter(l => l !== lang);
        if (activeLang === lang) setActiveLang(next[0] ?? "fr");
        return next;
      }
      if (!prev.includes(lang)) setActiveLang(lang);
      return [...prev, lang];
    });
  }

  function setLyric(lang: string, field: keyof LyricState, value: string) {
    setLyricsMap(prev => {
      const cur = prev[lang] ?? { text: "", phonetic: "" };
      return { ...prev, [lang]: { ...cur, [field]: value } };
    });
  }

  function setGuide(voice: string, field: keyof VoiceGuideLocal, value: string) {
    setGuidesMap(prev => {
      const cur = prev[voice] ?? { starting_note: "", entry_seconds: "", instructions: "" };
      return { ...prev, [voice]: { ...cur, [field]: value } };
    });
  }

  // ── Import fichier (Word / PDF / Image) ──
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setImporting(true); setImportError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur import");

      // 1. Insérer les paroles dans la langue active (ou détectée)
      const targetLang = data.language ?? activeLang;
      if (!langs.includes(targetLang)) {
        // Ajouter la langue détectée directement sans passer par toggleLang
        // pour éviter le conflit de setActiveLang
        setLangs(prev => [...prev, targetLang]);
      }
      setActiveLang(targetLang);
      setLyricsMap(prev => ({
        ...prev,
        [targetLang]: { text: data.lyrics ?? "", phonetic: "" },
      }));

      // 2. Appliquer le type liturgique détecté
      if (data.liturgical_type) {
        setType(data.liturgical_type);
        // Auto-détecter le type de chorale (catholique si type liturgique détecté)
        if (!choirType) setChoirType("catholique");
      }

      // 3. Aller directement à l'étape Paroles
      setStep("paroles");
    } catch (e: any) {
      setImportError(e.message);
    } finally {
      setImporting(false);
    }
  }

  // ── Transcription YouTube → paroles ──
  async function handleYoutubeTranscript() {
    if (!ytTranscriptUrl.trim()) return;
    setYtTranscribing(true); setImportError("");
    try {
      const res  = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: ytTranscriptUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur transcription YouTube");
      const lang = data.language ?? activeLang;
      if (!langs.includes(lang)) setLangs(prev => [...prev, lang]);
      setActiveLang(lang);
      setLyricsMap(prev => ({ ...prev, [lang]: { text: data.lyrics ?? "", phonetic: "" } }));
      if (data.liturgical_type) { setType(data.liturgical_type); if (!choirType) setChoirType("catholique"); }
      setYtTranscriptUrl("");
    } catch (e: any) {
      setImportError(e.message);
    } finally {
      setYtTranscribing(false);
    }
  }

  // ── Enregistrement vocal → paroles ──
  function startRecording() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setImportError("Reconnaissance vocale non supportée sur ce navigateur (Chrome/Edge recommandé)");
      return;
    }
    const recognition = new SR();
    recognition.lang        = activeLang === "fr" ? "fr-FR"
      : activeLang === "sw" ? "sw-KE"
      : activeLang === "en" ? "en-GB"
      : "fr-FR";
    recognition.continuous      = true;
    recognition.interimResults  = false;
    recognition.maxAlternatives = 1;

    let accumulated = lyricsMap[activeLang]?.text ?? "";

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        accumulated += (accumulated ? "\n" : "") + transcript;
      }
    };

    recognition.onerror = (event: any) => {
      setImportError(`Erreur microphone : ${event.error}`);
      setRecording(false);
    };

    recognition.onend = () => {
      setRecording(false);
      if (!accumulated.trim()) return;
      // Proposer le choix conserve / brouillon
      setVoiceDraft(accumulated);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
    setImportError("");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function acceptDraft(asDraft: boolean) {
    if (!voiceDraft) return;
    // Capturer la valeur AVANT de réinitialiser l'état (closure bug fix)
    const captured = voiceDraft;
    const text = asDraft
      ? `--- BROUILLON À COMPLÉTER ---\n${captured}\n--- FIN BROUILLON ---`
      : captured;
    const existing = lyricsMap[activeLang]?.text ?? "";
    setLyric(activeLang, "text", existing ? existing + "\n" + text : text);
    setVoiceDraft(null);
    // Nettoyage IA en arrière-plan (paroles définitives uniquement)
    if (!asDraft) {
      fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice_transcript: captured }),
      })
        .then(r => r.json())
        .then(data => { if (data.lyrics) setLyric(activeLang, "text", data.lyrics); })
        .catch(() => {});
    }
  }

  // ── YouTube metadata ──
  async function fetchYoutube() {
    if (!ytUrl.trim()) return;
    setYtFetching(true); setYtError("");
    try {
      const res  = await fetch(`/api/youtube?url=${encodeURIComponent(ytUrl.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "URL invalide");
      if (ytLinks.find(l => l.video_id === data.video_id)) { setYtError("Déjà ajouté."); return; }
      setYtLinks(prev => [...prev, { ...data, url: ytUrl.trim(), version_type: "choral" }]);
      setYtUrl("");
    } catch (e: any) { setYtError(e.message); }
    finally { setYtFetching(false); }
  }

  function stepComplete(s: Step): boolean {
    if (s === "infos")   return !!title.trim();
    if (s === "paroles") return langs.some(l => !!lyricsMap[l]?.text.trim());
    if (s === "voix")    return VOICE_KEYS.some(v => !!guidesMap[v]?.starting_note.trim());
    if (s === "youtube") return ytLinks.length > 0;
    return false;
  }

  // Génère un titre automatique depuis les paroles si le titre est vide
  function autoTitle(): string {
    if (title.trim()) return title.trim();
    // Chercher la première ligne non vide dans les paroles
    for (const lang of langs) {
      const firstLine = (lyricsMap[lang]?.text ?? "").split("\n")
        .map(l => l.trim())
        .find(l => l && !l.endsWith(":") && l.length > 2);
      if (firstLine) return firstLine.slice(0, 60);
    }
    return `Chant du ${new Date().toLocaleDateString("fr-FR")}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const effectiveTitle = autoTitle();
    if (effectiveTitle !== title) setTitle(effectiveTitle);
    setLoading(true); setError("");

    const lyrics = langs
      .filter(l => lyricsMap[l]?.text.trim())
      .map(l => ({ language: l, lyrics: lyricsMap[l].text.trim(), phonetic: lyricsMap[l].phonetic.trim() || null }));

    const youtube_links = ytLinks.map((l, i) => ({
      url: l.url, video_id: l.video_id, title: l.title, channel: l.channel,
      thumbnail: l.thumbnail ?? `https://img.youtube.com/vi/${l.video_id}/mqdefault.jpg`,
      version_type: l.version_type, is_primary: i === 0,
    }));

    const voice_guides = VOICE_KEYS
      .filter(v => guidesMap[v]?.starting_note.trim() || guidesMap[v]?.instructions.trim())
      .map(v => ({
        voice_part: v,
        starting_note: guidesMap[v].starting_note.trim() || null,
        entry_seconds: (() => { const n = Number(guidesMap[v].entry_seconds); return Number.isFinite(n) && n >= 0 ? n : null; })(),
        instructions: guidesMap[v].instructions.trim() || null,
      }));

    const payload = {
      title: effectiveTitle, choir_id: choirId,
      composer: composer || null, liturgical_type: type || null,
      liturgical_season: season || null, key_signature: key || null,
      tempo_bpm: bpm ? Number(bpm) : null, difficulty: diff || null,
      status, notes: notes || null, languages: langs,
      lyrics, youtube_links, voice_guides,
    };

    const result = isEdit
      ? await updateSongAction(initial.id, payload)
      : await createSongAction(payload);

    if ("error" in result) { setError(result.error); setLoading(false); return; }
    router.push(`/chants/${result.id}`);
  }

  const stepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Fil d'étapes ── */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {STEPS.map(({ key, label, icon: Icon }, i) => {
          const active   = key === step;
          const complete = stepComplete(key);
          return (
            <button key={key} type="button" onClick={() => setStep(key)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium flex-shrink-0 transition-all"
              style={{
                background: active ? "var(--gold)" : complete ? "rgba(160,98,26,0.08)" : "var(--surface)",
                color: active ? "white" : complete ? "var(--gold)" : "var(--text-2)",
                border: `1px solid ${active ? "var(--gold)" : complete ? "var(--gold-border)" : "var(--border)"}`,
              }}>
              {complete && !active
                ? <CheckCircle className="w-4 h-4 flex-shrink-0" />
                : <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
              }
              {label}
              {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-30" />}
            </button>
          );
        })}
      </div>

      {/* ══ ÉTAPE 1 : INFORMATIONS ══ */}
      {step === "infos" && (
        <div className="space-y-4">
          {/* Titre */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Music className="w-4 h-4" style={{ color: "var(--gold)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Titre et auteur</h2>
              <span className="text-xs ml-auto" style={{ color: "var(--text-3)" }}>* seul champ obligatoire</span>
            </div>
            <div>
              <label>Titre du chant *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Titre du chant" required
                style={{ fontSize: "1rem", fontWeight: 600 }} />
            </div>
            <div>
              <label>Compositeur / Auteur</label>
              <input value={composer} onChange={e => setComposer(e.target.value)}
                placeholder="Jean-Baptiste Dumont, Traditionnel…" />
            </div>
            <div>
              <label>Notes du chef de chœur</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Nuances, tempo, remarques d'interprétation…" rows={3} />
            </div>
          </div>

          {/* Type de chorale → affiche ou cache les types liturgiques */}
          <div className="card space-y-4">
            <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Info className="w-4 h-4" style={{ color: "var(--gold)" }} />
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Type de chorale</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHOIR_TYPES.map(({ value, label }) => (
                <button key={value} type="button" onClick={() => setChoirType(value)}
                  className={`chip ${choirType === value ? "chip-on" : "chip-off"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Champs liturgiques — apparaissent seulement si Catholique/Orthodoxe */}
            {(choirType === "catholique" || choirType === "orthodoxe") && (
              <div className="grid grid-cols-2 gap-3 pt-2" style={{ borderTop: "1px dashed var(--border)" }}>
                <div>
                  <label>Type liturgique</label>
                  <select value={type} onChange={e => setType(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {LITURGICAL_TYPE_VALUES.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Temps liturgique</label>
                  <select value={season} onChange={e => setSeason(e.target.value)}>
                    <option value="">— Sélectionner —</option>
                    {LITURGICAL_SEASONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Champs musicaux toujours disponibles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label>Tonalité</label>
                <select value={key} onChange={e => setKey(e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {MUSICAL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label>BPM (tempo)</label>
                <input type="number" value={bpm} onChange={e => setBpm(e.target.value)}
                  placeholder="ex: 120" min={40} max={240} />
              </div>
              <div>
                <label>Difficulté</label>
                <select value={diff} onChange={e => setDiff(e.target.value)}>
                  {DIFFICULTIES.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Statut</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  {SONG_STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Langues — liste déroulante avec ajout/suppression */}
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>
                Langues du chant
              </h2>
              <span className="text-xs" style={{ color: "var(--text-3)" }}>
                {langs.length} langue{langs.length > 1 ? "s" : ""} sélectionnée{langs.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* Langues sélectionnées */}
            {langs.length > 0 && (
              <div className="space-y-1.5">
                {langs.map(code => {
                  const label = getLangLabel(code);
                  return (
                    <div key={code}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg"
                      style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-black"
                          style={{ background: "var(--gold-dim)", color: "var(--gold)" }}>
                          {code.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                          {label}
                        </span>
                        {lyricsMap[code]?.text.trim() && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full"
                            style={{ background: "rgba(74,124,89,0.1)", color: "#4A7C59" }}>
                            Paroles saisies
                          </span>
                        )}
                      </div>
                      <button type="button"
                        onClick={() => toggleLang(code)}
                        className="w-7 h-7 rounded-md flex items-center justify-center"
                        style={{ color: "var(--text-3)" }}
                        title="Supprimer cette langue">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ajouter une langue prédéfinie */}
            <div className="flex gap-2">
              <select
                value={addLangSelect}
                onChange={e => setAddLangSelect(e.target.value)}
                style={{ flex: 1 }}>
                <option value="">— Choisir une langue —</option>
                {(Object.entries(LANGUAGE_LABELS) as [string, string][])
                  .filter(([code]) => !langs.includes(code))
                  .map(([code, label]) => (
                    <option key={code} value={code}>{label} ({code.toUpperCase()})</option>
                  ))}
              </select>
              <button type="button"
                disabled={!addLangSelect}
                onClick={() => {
                  if (addLangSelect) { toggleLang(addLangSelect); setAddLangSelect(""); }
                }}
                className="btn btn-primary btn-sm flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Ajouter une langue personnalisée (saisie libre) */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: "var(--text-3)" }}>
                Autre langue (saisie libre) :
              </p>
              <div className="flex gap-2">
                <input
                  value={addLangCustom}
                  onChange={e => setAddLangCustom(e.target.value)}
                  placeholder="ex: Lingala, Yoruba, Latin, Arabe…"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const raw  = addLangCustom.trim();
                      const code = raw.toLowerCase().replace(/\s+/g, "_");
                      if (code && !langs.includes(code)) {
                        toggleLang(code);
                        setCustomLabels(prev => ({ ...prev, [code]: raw }));
                        setAddLangCustom("");
                      }
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button type="button"
                  disabled={!addLangCustom.trim()}
                  onClick={() => {
                    const raw  = addLangCustom.trim();
                    const code = raw.toLowerCase().replace(/\s+/g, "_");
                    if (code && !langs.includes(code)) {
                      toggleLang(code);
                      setCustomLabels(prev => ({ ...prev, [code]: raw }));
                      setAddLangCustom("");
                    }
                  }}
                  className="btn btn-secondary btn-sm flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 2 : PAROLES ══ */}
      {step === "paroles" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: "var(--gold)" }} />
                <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Paroles</h2>
              </div>
            </div>

            {/* ── Outils IA ── */}
            <div className="rounded-xl p-3 space-y-3"
              style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: "var(--gold)" }} />
                <p className="text-xs font-semibold" style={{ color: "var(--gold)" }}>
                  Importer les paroles automatiquement
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Import fichier */}
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  {importing
                    ? <><Loader2 className="w-3.5 h-3.5 spin" /> Analyse…</>
                    : <><Upload className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} /> Word / PDF / Photo</>
                  }
                </button>
                <input ref={fileInputRef} type="file"
                  accept=".docx,.doc,.pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleFileImport} className="hidden" />

                {/* Enregistrement vocal */}
                <button type="button"
                  onClick={recording ? stopRecording : startRecording}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: recording ? "rgba(192,57,43,0.1)" : "var(--surface)",
                    border: `1px solid ${recording ? "rgba(192,57,43,0.3)" : "var(--border)"}`,
                    color: recording ? "var(--red)" : "var(--text-1)",
                  }}>
                  {recording
                    ? <><Square className="w-3.5 h-3.5" fill="currentColor" /> Arrêter</>
                    : <><Mic className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} /> Chanter / Dicter</>
                  }
                </button>

                {/* YouTube → paroles */}
                <button type="button"
                  onClick={() => setYtTranscriptUrl(ytTranscriptUrl === "open" ? "" : "open")}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-1)" }}>
                  <PlayCircle className="w-3.5 h-3.5" style={{ color: "#CC0000" }} /> YouTube → Paroles
                </button>
              </div>

              {/* Champ URL YouTube transcript */}
              {ytTranscriptUrl !== "" && ytTranscriptUrl !== "open" && (
                <div className="flex gap-2">
                  <input value={ytTranscriptUrl} onChange={e => setYtTranscriptUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    className="flex-1" style={{ fontSize: "0.8rem" }} />
                  <button type="button" onClick={handleYoutubeTranscript}
                    disabled={ytTranscribing || !ytTranscriptUrl.trim()}
                    className="btn btn-primary btn-sm flex-shrink-0">
                    {ytTranscribing ? <Loader2 className="w-3.5 h-3.5 spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
              {ytTranscriptUrl === "open" && (
                <div className="flex gap-2">
                  <input autoFocus
                    placeholder="https://youtube.com/watch?v=…"
                    onChange={e => setYtTranscriptUrl(e.target.value)}
                    className="flex-1" style={{ fontSize: "0.8rem" }} />
                  <button type="button" onClick={handleYoutubeTranscript}
                    disabled={ytTranscribing}
                    className="btn btn-primary btn-sm flex-shrink-0">
                    {ytTranscribing ? <Loader2 className="w-3.5 h-3.5 spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              {recording && (
                <p className="text-xs flex items-center gap-2"
                  style={{ color: "var(--red)" }}>
                  <span className="w-2 h-2 rounded-full bg-current inline-block animate-pulse" />
                  Enregistrement en cours… Chantez ou dictez les paroles.
                </p>
              )}

              {/* ── Dialog conservation après enregistrement ── */}
              {voiceDraft && (
                <div className="rounded-xl p-4 space-y-3"
                  style={{ background: "var(--surface)", border: "2px solid var(--gold-border)",
                    boxShadow: "0 4px 20px rgba(160,98,26,0.12)" }}>
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4" style={{ color: "var(--gold)" }} />
                    <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>
                      Enregistrement terminé
                    </p>
                  </div>
                  {/* Aperçu de ce qui a été enregistré */}
                  <div className="rounded-lg p-3 max-h-32 overflow-y-auto"
                    style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                    <pre className="text-xs whitespace-pre-wrap" style={{ fontFamily: "inherit", color: "var(--text-2)" }}>
                      {voiceDraft}
                    </pre>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-2)" }}>
                    Que souhaitez-vous faire avec cet enregistrement ?
                  </p>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => acceptDraft(false)}
                      className="btn btn-primary btn-sm flex-1 justify-center">
                      <CheckCircle className="w-4 h-4" /> Conserver comme paroles
                    </button>
                    <button type="button"
                      onClick={() => acceptDraft(true)}
                      className="btn btn-secondary btn-sm flex-1 justify-center"
                      style={{ color: "var(--text-2)" }}>
                      <FileText className="w-4 h-4" /> Brouillon à retravailler
                    </button>
                    <button type="button"
                      onClick={() => setVoiceDraft(null)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ color: "var(--text-3)", background: "var(--surface-2)" }}
                      title="Annuler">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {importError && (
                <p className="text-xs px-3 py-2 rounded-lg"
                  style={{ background: "var(--red-dim)", color: "var(--red)" }}>
                  {importError}
                </p>
              )}
            </div>

            {/* Onglets langues */}
            {langs.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  Aucune langue sélectionnée.
                </p>
                <button type="button" onClick={() => setStep("infos")}
                  className="btn btn-secondary btn-sm mt-3 inline-flex">
                  ← Retour aux informations
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-1 flex-wrap">
                  {langs.map(lang => {
                    const label  = getLangLabel(lang);
                    const filled = !!lyricsMap[lang]?.text.trim();
                    return (
                      <button key={lang} type="button" onClick={() => setActiveLang(lang)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: activeLang === lang ? "var(--gold)" : filled ? "var(--gold-dim)" : "var(--surface-2)",
                          color: activeLang === lang ? "white" : filled ? "var(--gold)" : "var(--text-2)",
                          border: `1px solid ${activeLang === lang ? "var(--gold)" : filled ? "var(--gold-border)" : "var(--border)"}`,
                        }}>
                        {filled && <CheckCircle className="w-3 h-3" />}
                        {label}
                      </button>
                    );
                  })}
                </div>

                {langs.includes(activeLang) && (() => {
                  const label = getLangLabel(activeLang);
                  const entry = lyricsMap[activeLang] ?? { text: "", phonetic: "" };
                  return (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label style={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 600 }}>
                            Paroles — {label}
                          </label>
                          <span className="text-xs" style={{ color: "var(--text-3)" }}>
                            {entry.text.split('\n').filter(l => l.trim()).length} lignes
                          </span>
                        </div>
                        <textarea
                          value={entry.text}
                          onChange={e => setLyric(activeLang, "text", e.target.value)}
                          placeholder={`Couplet 1 :\n…\n\nRefrain :\n…\n\nCouplet 2 :\n…`}
                          rows={14}
                          style={{ fontFamily: "'Courier New', monospace", fontSize: "0.875rem", lineHeight: 1.8 }}
                        />
                      </div>
                      <div>
                        <label>Guide de prononciation (optionnel)</label>
                        <input
                          value={entry.phonetic}
                          onChange={e => setLyric(activeLang, "phonetic", e.target.value)}
                          placeholder="ex: Ma-ri-a gra-tsi-a plen-a…"
                        />
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 3 : GUIDES VOCAUX ══ */}
      {step === "voix" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <Mic2 className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Guides vocaux par pupitre</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>
            Renseignez les informations pour chaque pupitre. Laissez vide ce qui ne s'applique pas.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VOICE_KEYS.map(v => {
              const ui     = VOICE_UI[v];
              const g      = guidesMap[v] ?? { starting_note: "", entry_seconds: "", instructions: "" };
              const filled = !!(g.starting_note.trim() || g.instructions.trim());
              return (
                <div key={v} className="rounded-xl p-4 space-y-3"
                  style={{ background: "var(--surface-2)", border: `1px solid ${filled ? `${ui.color}40` : "var(--border)"}` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                      style={{ background: `${ui.color}18`, color: ui.color }}>
                      {ui.short}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>{ui.label}</p>
                      {filled && <p className="text-xs" style={{ color: ui.color }}>● Renseigné</p>}
                    </div>
                  </div>
                  <div>
                    <label>Note de départ</label>
                    <input value={g.starting_note} onChange={e => setGuide(v, "starting_note", e.target.value)}
                      placeholder="ex: Sol4, Mi♭4…" />
                  </div>
                  <div>
                    <label>Entrée (secondes)</label>
                    <input type="number" value={g.entry_seconds}
                      onChange={e => setGuide(v, "entry_seconds", e.target.value)}
                      placeholder="ex: 12" min={0} />
                  </div>
                  <div>
                    <label>Instructions</label>
                    <textarea value={g.instructions} onChange={e => setGuide(v, "instructions", e.target.value)}
                      placeholder="Nuances, phrasé, respiration…" rows={2} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ ÉTAPE 4 : YOUTUBE ══ */}
      {step === "youtube" && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <ExternalLink className="w-4 h-4" style={{ color: "#CC0000" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>Liens YouTube</h2>
          </div>
          <p className="text-xs" style={{ color: "var(--text-2)" }}>
            Version chorale complète, karaoké, guide par voix…
          </p>

          {ytLinks.length > 0 && (
            <div className="space-y-2">
              {ytLinks.map((l, i) => (
                <div key={l.video_id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.thumbnail || `https://img.youtube.com/vi/${l.video_id}/mqdefault.jpg`}
                    alt="" className="w-16 h-11 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                      {l.title || "Sans titre"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-2)" }}>{l.channel}</p>
                    {i === 0 && <span className="text-xs font-semibold" style={{ color: "var(--gold)" }}>★ Principal</span>}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <select value={l.version_type}
                      onChange={e => setYtLinks(prev => prev.map(x =>
                        x.video_id === l.video_id ? { ...x, version_type: e.target.value } : x
                      ))}
                      style={{ width: "auto", padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}>
                      {["choral","karaoke","satb","soprano","alto","tenor","basse","instrumental"].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setYtLinks(prev => prev.filter(x => x.video_id !== l.video_id))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center ml-auto"
                      style={{ color: "var(--red)", background: "var(--red-dim)" }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div>
            <label>Coller un lien YouTube</label>
            <div className="flex gap-2">
              <input value={ytUrl} onChange={e => setYtUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); fetchYoutube(); } }} />
              <button type="button" onClick={fetchYoutube} disabled={ytFetching || !ytUrl.trim()}
                className="btn btn-primary btn-sm flex-shrink-0">
                {ytFetching ? <Loader2 className="w-4 h-4 spin" /> : <Plus className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {ytError && (
            <p className="text-xs px-3 py-2 rounded-lg"
              style={{ background: "var(--red-dim)", color: "var(--red)" }}>{ytError}</p>
          )}
        </div>
      )}

      {/* ── Erreur globale ── */}
      {error && (
        <div className="text-sm rounded-xl px-4 py-3"
          style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(192,57,43,0.2)" }}>
          {error}
        </div>
      )}

      {/* ── Navigation — chaque étape est autonome ── */}
      <div className="space-y-2.5">

        {/* Bouton sauvegarde — visible sur chaque onglet, autonome */}
        <button type="submit" disabled={loading}
          className="btn btn-primary w-full justify-center"
          style={{ padding: "0.75rem" }}>
          {loading
            ? <><Loader2 className="w-4 h-4 spin" /> Enregistrement…</>
            : isEdit
              ? <><CheckCircle className="w-4 h-4" /> Enregistrer les modifications</>
              : title.trim()
                ? <><CheckCircle className="w-4 h-4" /> Créer le chant</>
                : <><CheckCircle className="w-4 h-4" /> Créer le chant {step !== "infos" ? "(titre auto)" : ""}</>
          }
        </button>

        {/* Indicateur titre manquant */}
        {!title.trim() && step !== "infos" && (
          <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
            Le titre sera généré depuis le contenu · vous pourrez le modifier ensuite
          </p>
        )}

        {/* Navigation entre étapes */}
        <div className="flex gap-2">
          <button type="button"
            onClick={() => {
              const prev = STEPS[stepIdx - 1];
              if (prev) setStep(prev.key);
              else router.back();
            }}
            className="btn btn-secondary flex-shrink-0">
            {stepIdx === 0 ? "Annuler" : "← Retour"}
          </button>
          <div className="flex-1" />
          {stepIdx < STEPS.length - 1 && (
            <button type="button"
              onClick={() => { setError(""); setStep(STEPS[stepIdx + 1].key); }}
              className="btn btn-secondary flex-shrink-0">
              Étape suivante →
            </button>
          )}
        </div>
      </div>

      {/* Indicateur de progression */}
      <div className="flex justify-center gap-1.5">
        {STEPS.map(s => (
          <div key={s.key} className="h-1 rounded-full transition-all"
            style={{
              width: s.key === step ? 24 : 8,
              background: s.key === step ? "var(--gold)" : stepComplete(s.key) ? "rgba(160,98,26,0.35)" : "var(--border-2)",
            }} />
        ))}
      </div>
    </form>
  );
}
