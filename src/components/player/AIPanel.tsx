"use client";
import { Sparkles, Music, Zap, Layers, ArrowUpDown } from "lucide-react";

type Props = {
  bpm?: number | null;
  keySignature?: string | null;
  difficulty?: string | null;
  liturgicalType?: string | null;
  languages?: string[] | null;
};

const STRUCTURE_LABELS: Record<string, { emoji: string; label: string }> = {
  "entrée":      { emoji: "🚶", label: "Procession" },
  "kyrie":       { emoji: "🙏", label: "Kyrie" },
  "gloria":      { emoji: "✨", label: "Gloria" },
  "psaume":      { emoji: "📖", label: "Psaume" },
  "alléluia":    { emoji: "🎉", label: "Alléluia" },
  "sanctus":     { emoji: "⭐", label: "Sanctus" },
  "agnus dei":   { emoji: "🕊️", label: "Agnus Dei" },
  "communion":   { emoji: "🍷", label: "Communion" },
  "sortie":      { emoji: "🚪", label: "Sortie" },
};

const DIFFICULTY_BAR: Record<string, { width: string; color: string; label: string }> = {
  "facile":    { width: "33%",  color: "#4ade80", label: "Facile" },
  "moyen":     { width: "66%",  color: "#C9A227", label: "Intermédiaire" },
  "difficile": { width: "100%", color: "#f87171", label: "Difficile" },
};

export default function AIPanel({ bpm, keySignature, difficulty, liturgicalType, languages }: Props) {
  const structure = liturgicalType ? STRUCTURE_LABELS[liturgicalType.toLowerCase()] : null;
  const diff = difficulty ? DIFFICULTY_BAR[difficulty.toLowerCase()] : null;

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--violet-dim)" }}>
            <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--violet)" }} />
          </div>
          <p className="font-bold text-sm text-white">Analyse IA</p>
        </div>
        <span className="ai-badge">
          <Sparkles className="w-2.5 h-2.5" />
          AI
        </span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="ai-stat">
          <Music className="w-4 h-4 mb-2" style={{ color: "var(--gold)" }} />
          <div className="ai-stat-value" style={{ fontSize: "1rem" }}>
            {keySignature ?? "—"}
          </div>
          <div className="ai-stat-label">Tonalité</div>
        </div>
        <div className="ai-stat">
          <Zap className="w-4 h-4 mb-2" style={{ color: "#60a5fa" }} />
          <div className="ai-stat-value">
            {bpm ?? "—"}
          </div>
          <div className="ai-stat-label">BPM</div>
        </div>
        <div className="ai-stat">
          <Layers className="w-4 h-4 mb-2" style={{ color: "#fb923c" }} />
          <div className="ai-stat-value" style={{ fontSize: "1.1rem" }}>
            {structure ? structure.emoji : "—"}
          </div>
          <div className="ai-stat-label">{structure?.label ?? "Moment"}</div>
        </div>
      </div>

      {/* Difficulty */}
      {diff && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
              Difficulté
            </p>
            <span className="text-xs font-bold" style={{ color: diff.color }}>{diff.label}</span>
          </div>
          <div className="mastery-bar">
            <div className="mastery-fill" style={{ width: diff.width, background: diff.color }} />
          </div>
        </div>
      )}

      {/* Languages */}
      {languages && languages.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-3)" }}>
            Langues
          </p>
          <div className="flex flex-wrap gap-1.5">
            {languages.map((lang) => (
              <span key={lang} className="chip chip-off text-xs py-1 px-2.5 uppercase font-bold tracking-wider">
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI actions */}
      <div className="space-y-2 pt-1">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
          Actions IA
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: ArrowUpDown, label: "Transposer", color: "var(--violet)" },
            { icon: Sparkles,    label: "Analyser",   color: "var(--gold)" },
          ].map(({ icon: Icon, label, color }) => (
            <button key={label} type="button"
              className="flex items-center gap-2 p-3 rounded-xl text-left transition-colors"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
              <span className="text-xs font-semibold text-white">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
