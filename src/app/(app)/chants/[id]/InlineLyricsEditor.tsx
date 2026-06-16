"use client";
import { useState, useRef } from "react";
import { Plus, Save, X, Loader2, CheckCircle, Upload, Mic, Square } from "lucide-react";
import { saveLyricsAction } from "@/actions/songs";
import { LANGUAGE_LABELS } from "@/types";
import { useRouter } from "next/navigation";

interface LyricEntry {
  language: string;
  lyrics: string;
  phonetic: string;
}

interface Props {
  songId: string;
  initialLyrics: { language: string; lyrics: string | null; phonetic: string | null }[];
}

const KNOWN_LANGS = Object.entries(LANGUAGE_LABELS) as [string, string][];

export default function InlineLyricsEditor({ songId, initialLyrics }: Props) {
  const router = useRouter();
  const [entries, setEntries] = useState<LyricEntry[]>(
    initialLyrics.length > 0
      ? initialLyrics.map(l => ({ language: l.language, lyrics: l.lyrics ?? "", phonetic: l.phonetic ?? "" }))
      : [{ language: "fr", lyrics: "", phonetic: "" }]
  );
  const [activeLang, setActiveLang]   = useState(entries[0]?.language ?? "fr");
  const [addLang,    setAddLang]      = useState("");
  const [customLang, setCustomLang]   = useState("");
  const [saving,     setSaving]       = useState(false);
  const [saved,      setSaved]        = useState(false);
  const [error,      setError]        = useState("");
  const [importing,  setImporting]    = useState(false);
  const [recording,  setRecording]    = useState(false);
  const recognitionRef = useRef<any>(null);

  const activeEntry = entries.find(e => e.language === activeLang);

  function getLangLabel(code: string) {
    return LANGUAGE_LABELS[code as keyof typeof LANGUAGE_LABELS]
      ?? code.replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }

  function updateEntry(lang: string, field: "lyrics" | "phonetic", value: string) {
    setEntries(prev => prev.map(e => e.language === lang ? { ...e, [field]: value } : e));
    setSaved(false);
  }

  function addLanguage(code: string, label?: string) {
    if (!code || entries.find(e => e.language === code)) return;
    setEntries(prev => [...prev, { language: code, lyrics: "", phonetic: "" }]);
    setActiveLang(code);
    setAddLang(""); setCustomLang("");
  }

  function removeLang(code: string) {
    const next = entries.filter(e => e.language !== code);
    setEntries(next);
    if (activeLang === code) setActiveLang(next[0]?.language ?? "fr");
  }

  async function handleSave() {
    const toSave = entries.filter(e => e.lyrics.trim());
    if (toSave.length === 0) { setError("Saisissez au moins une langue de paroles."); return; }
    setSaving(true); setError("");
    const res = await saveLyricsAction(songId,
      toSave.map(e => ({ language: e.language, lyrics: e.lyrics.trim(), phonetic: e.phonetic.trim() || null }))
    );
    setSaving(false);
    if ("error" in res) { setError(res.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  // Import fichier
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/transcribe", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur import");
      const lang = data.language ?? activeLang;
      if (!entries.find(e => e.language === lang)) {
        setEntries(prev => [...prev, { language: lang, lyrics: data.lyrics ?? "", phonetic: "" }]);
      } else {
        updateEntry(lang, "lyrics", data.lyrics ?? "");
      }
      setActiveLang(lang);
    } catch (e: any) { setError(e.message); }
    finally { setImporting(false); }
  }

  // Enregistrement vocal
  function startVoice() {
    if (recording) return; // garde contre double enregistrement
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Reconnaissance vocale non supportée (Chrome/Edge)"); return; }
    const rec = new SR();
    rec.lang = activeLang === "fr" ? "fr-FR" : activeLang === "en" ? "en-GB" : activeLang === "sw" ? "sw-KE" : "fr-FR";
    rec.continuous = true; rec.interimResults = false;
    let acc = activeEntry?.lyrics ?? "";
    rec.onresult = (ev: any) => {
      for (let i = ev.resultIndex; i < ev.results.length; i++)
        acc += (acc ? "\n" : "") + ev.results[i][0].transcript;
      updateEntry(activeLang, "lyrics", acc);
    };
    rec.onerror = () => setRecording(false);
    rec.onend   = () => setRecording(false);
    recognitionRef.current = rec;
    rec.start(); setRecording(true);
  }
  function stopVoice() { recognitionRef.current?.stop(); setRecording(false); }

  const filledCount = entries.filter(e => e.lyrics.trim()).length;

  return (
    <div className="space-y-4">

      {/* Onglets langues */}
      <div className="flex items-center gap-2 flex-wrap">
        {entries.map(e => (
          <button key={e.language} type="button"
            onClick={() => setActiveLang(e.language)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: activeLang === e.language ? "var(--gold)" : e.lyrics.trim() ? "var(--gold-dim)" : "var(--surface-2)",
              color: activeLang === e.language ? "white" : e.lyrics.trim() ? "var(--gold)" : "var(--text-2)",
              border: `1px solid ${activeLang === e.language ? "var(--gold)" : e.lyrics.trim() ? "var(--gold-border)" : "var(--border)"}`,
            }}>
            {e.lyrics.trim() && <CheckCircle className="w-3 h-3" />}
            {getLangLabel(e.language)}
            {entries.length > 1 && activeLang === e.language && (
              <span onClick={ev => { ev.stopPropagation(); removeLang(e.language); }}
                className="ml-0.5 opacity-70 hover:opacity-100">
                <X className="w-3 h-3" />
              </span>
            )}
          </button>
        ))}

        {/* Ajouter une langue prédéfinie */}
        <select value={addLang}
          onChange={e => { if (e.target.value) { addLanguage(e.target.value); } setAddLang(""); }}
          className="text-xs"
          style={{ width: "auto", padding: "0.3rem 0.75rem" }}>
          <option value="">+ Langue</option>
          {KNOWN_LANGS.filter(([code]) => !entries.find(e => e.language === code))
            .map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>

      {/* Langue personnalisée */}
      <div className="flex gap-2">
        <input value={customLang} onChange={e => setCustomLang(e.target.value)}
          placeholder="Autre langue (Lingala, Latin, Arabe…)"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLanguage(customLang.toLowerCase().replace(/\s+/g, "_"), customLang); }}}
          style={{ flex: 1, fontSize: "0.8rem", padding: "0.5rem 0.75rem" }} />
        <button type="button" disabled={!customLang.trim()}
          onClick={() => addLanguage(customLang.trim().toLowerCase().replace(/\s+/g, "_"), customLang.trim())}
          className="btn btn-secondary btn-sm flex-shrink-0">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outils IA */}
      <div className="flex gap-2 flex-wrap">
        <label className="btn btn-secondary btn-sm cursor-pointer flex items-center gap-2">
          {importing ? <><Loader2 className="w-3.5 h-3.5 spin" /> Import…</> : <><Upload className="w-3.5 h-3.5" /> Word / PDF / Photo</>}
          <input type="file" accept=".docx,.doc,.pdf,.jpg,.jpeg,.png,.webp"
            onChange={handleFileImport} className="hidden" disabled={importing} />
        </label>
        <button type="button" onClick={recording ? stopVoice : startVoice}
          className="btn btn-sm"
          style={{
            background: recording ? "rgba(192,57,43,0.1)" : "var(--surface-2)",
            color: recording ? "var(--red)" : "var(--text-2)",
            border: `1px solid ${recording ? "rgba(192,57,43,0.3)" : "var(--border)"}`,
          }}>
          {recording
            ? <><Square className="w-3.5 h-3.5" fill="currentColor" /> Arrêter</>
            : <><Mic className="w-3.5 h-3.5" /> Dicter</>
          }
        </button>
        {recording && (
          <span className="text-xs flex items-center gap-1 animate-pulse" style={{ color: "var(--red)" }}>
            <span className="w-2 h-2 rounded-full bg-current inline-block" />
            Enregistrement…
          </span>
        )}
      </div>

      {/* Éditeur de paroles */}
      {activeEntry && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label style={{ textTransform: "none", fontSize: "0.8rem", fontWeight: 600, marginBottom: 0 }}>
              Paroles — {getLangLabel(activeLang)}
            </label>
            <span className="text-xs" style={{ color: "var(--text-3)" }}>
              {activeEntry.lyrics.split("\n").filter(l => l.trim()).length} lignes
            </span>
          </div>
          <textarea
            value={activeEntry.lyrics}
            onChange={e => updateEntry(activeLang, "lyrics", e.target.value)}
            placeholder={`Couplet 1 :\n…\n\nRefrain :\n…`}
            rows={12}
            style={{ fontFamily: "'Courier New', monospace", fontSize: "0.875rem", lineHeight: 1.8 }}
          />
          <div>
            <label style={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 500, color: "var(--text-3)", marginBottom: "0.25rem" }}>
              Guide de prononciation (optionnel)
            </label>
            <input
              value={activeEntry.phonetic}
              onChange={e => updateEntry(activeLang, "phonetic", e.target.value)}
              placeholder="Transcription phonétique…"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg"
          style={{ background: "var(--red-dim)", color: "var(--red)" }}>{error}</p>
      )}

      {/* Bouton sauvegarde */}
      <button type="button" onClick={handleSave} disabled={saving}
        className="btn btn-primary w-full justify-center"
        style={{ padding: "0.75rem" }}>
        {saving
          ? <><Loader2 className="w-4 h-4 spin" /> Enregistrement…</>
          : saved
            ? <><CheckCircle className="w-4 h-4" /> Paroles enregistrées !</>
            : <><Save className="w-4 h-4" /> Enregistrer les paroles ({filledCount} langue{filledCount > 1 ? "s" : ""})</>
        }
      </button>
    </div>
  );
}
