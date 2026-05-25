"use client";
import { useState } from "react";
import { useChoir } from "@/hooks/useChoir";
import { Settings, Copy, RefreshCw, Users, Shield, Music2, Check, Edit2 } from "lucide-react";
import CantorIcon from "@/components/CantorIcon";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  chef:     { label: "Chef de chœur", color: "#C9A227" },
  chantre:  { label: "Chantre",       color: "#7F77DD" },
  choriste: { label: "Choriste",      color: "#1D9E75" },
};

const VOICE_COLORS: Record<string, string> = {
  soprano: "#f472b6", alto: "#fb923c", tenor: "#60a5fa", basse: "#4ade80",
};

export default function ParametresPage() {
  const { choir, role, members, loading, error, refetch } = useChoir();
  const [copied,    setCopied]    = useState(false);
  const [regen,     setRegen]     = useState(false);
  const [editName,  setEditName]  = useState(false);
  const [name,      setName]      = useState("");
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState("");

  async function copyCode() {
    if (!choir?.invite_code) return;
    await navigator.clipboard.writeText(choir.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegen() {
    if (!confirm("Générer un nouveau code ? L'ancien ne fonctionnera plus.")) return;
    setRegen(true);
    await fetch("/api/choir", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "regenerate_invite" }),
    });
    setRegen(false);
    refetch();
  }

  async function handleSaveName() {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/choir", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setSaving(false);
    setSaveMsg("Enregistré !");
    setEditName(false);
    setTimeout(() => setSaveMsg(""), 2000);
    refetch();
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 pt-12 flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent spin"
        style={{ borderColor: "var(--gold)", borderTopColor: "transparent" }} />
    </div>
  );

  if (error || !choir) return (
    <div className="max-w-2xl mx-auto px-4 pt-12 text-center space-y-4">
      <p className="text-sm" style={{ color: "var(--text-2)" }}>
        {error ?? "Aucune chorale trouvée."}
      </p>
    </div>
  );

  const isChef = role === "chef";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-6 fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: "var(--gold-dim)", border: "1px solid var(--border-gold)" }}>
          <Settings className="w-5 h-5" style={{ color: "var(--gold)" }} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Paramètres</h1>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Gestion de la chorale</p>
        </div>
        {saveMsg && (
          <span className="ml-auto text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(29,158,117,0.2)", color: "#1D9E75" }}>
            ✓ {saveMsg}
          </span>
        )}
      </div>

      {/* Chorale info */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Music2 className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <h2 className="font-bold text-sm text-white">Informations de la chorale</h2>
        </div>

        {/* Name */}
        <div>
          <label>Nom de la chorale</label>
          {editName ? (
            <div className="flex gap-2 mt-1">
              <input value={name} onChange={(e) => setName(e.target.value)}
                placeholder={choir.name} autoFocus />
              <button onClick={handleSaveName} disabled={saving}
                className="btn btn-primary flex-shrink-0" style={{ padding: "0 1rem" }}>
                {saving ? "…" : <Check className="w-4 h-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
              <span className="text-sm font-semibold text-white">{choir.name}</span>
              {isChef && (
                <button onClick={() => { setName(choir.name); setEditName(true); }}
                  style={{ color: "var(--text-3)" }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {choir.description && (
          <div>
            <label>Description</label>
            <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--text-2)" }}>
              {choir.description}
            </p>
          </div>
        )}
      </div>

      {/* Invite code */}
      <div className="card-gold space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <h2 className="font-bold text-sm text-white">Code d'invitation</h2>
        </div>
        <p className="text-xs" style={{ color: "var(--text-2)" }}>
          Partagez ce code pour que de nouveaux membres rejoignent votre chorale.
        </p>

        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: "rgba(201,162,39,0.08)", border: "1px solid var(--border-gold)" }}>
          <span className="text-3xl font-black tracking-[0.25em] text-white flex-1 text-center"
            style={{ fontVariantNumeric: "tabular-nums" }}>
            {choir.invite_code ?? "——"}
          </span>
          <button onClick={copyCode}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
            style={{
              background: copied ? "rgba(29,158,117,0.2)" : "var(--gold-dim)",
              border: `1px solid ${copied ? "#1D9E75" : "var(--border-gold)"}`,
              color: copied ? "#1D9E75" : "var(--gold)",
            }}>
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {isChef && (
          <button onClick={handleRegen} disabled={regen}
            className="btn btn-gold-outline w-full justify-center text-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${regen ? "spin" : ""}`} />
            Générer un nouveau code
          </button>
        )}
      </div>

      {/* Members */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" style={{ color: "var(--violet)" }} />
            <h2 className="font-bold text-sm text-white">Membres</h2>
          </div>
          <span className="badge" style={{ background: "var(--violet-dim)", color: "var(--violet)" }}>
            {members.length}
          </span>
        </div>

        {members.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--text-2)" }}>
            Aucun membre pour l'instant.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const roleInfo = ROLE_LABELS[m.role] ?? { label: m.role, color: "var(--text-2)" };
              const voiceColor = m.voice ? VOICE_COLORS[m.voice] : null;
              return (
                <div key={m.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}>
                    {m.user_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${roleInfo.color}20`, color: roleInfo.color }}>
                        {roleInfo.label}
                      </span>
                      {m.voice && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                          style={{ background: `${voiceColor}20`, color: voiceColor ?? "white" }}>
                          {m.voice}
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      Rejoint le {new Date(m.joined_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* API info */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <div className="ai-badge">API</div>
          <h2 className="font-bold text-sm text-white">Web Service API</h2>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>
          Cantor expose une API REST consommable depuis n'importe quel client.
        </p>
        <div className="space-y-1.5">
          {[
            ["GET",    "/api/chants",       "Liste des chants"],
            ["POST",   "/api/chants",       "Créer un chant"],
            ["GET",    "/api/messe",        "Feuilles de messe"],
            ["GET",    "/api/repetitions",  "Répétitions"],
            ["GET",    "/api/choir",        "Infos & membres"],
            ["GET",    "/api/youtube?url=", "Infos vidéo YouTube"],
          ].map(([method, path, desc]) => (
            <div key={`${method}-${path}`} className="flex items-center gap-3 px-3 py-2 rounded-xl"
              style={{ background: "var(--surface-2)" }}>
              <span className="text-xs font-black w-10 flex-shrink-0"
                style={{ color: method === "GET" ? "#60a5fa" : method === "POST" ? "#4ade80" : "#C9A227" }}>
                {method}
              </span>
              <code className="text-xs font-mono text-white flex-1 truncate">{path}</code>
              <span className="text-xs hidden sm:block flex-shrink-0" style={{ color: "var(--text-3)" }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cantor branding */}
      <div className="flex justify-center pt-4 pb-2">
        <CantorIcon size={32} showText />
      </div>
    </div>
  );
}
