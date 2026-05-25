"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const CYCLE: Record<string, string> = {
  nouveau:  "en_cours",
  en_cours: "appris",
  appris:   "nouveau",
};

const LABELS: Record<string, { label: string; bg: string; color: string }> = {
  nouveau:  { label: "Nouveau",   bg: "rgba(107,114,128,0.15)", color: "#9ca3af" },
  en_cours: { label: "En cours",  bg: "rgba(251,146,60,0.15)",  color: "#fb923c" },
  appris:   { label: "Appris ✓",  bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
};

export default function MasteryButton({ songId, initialStatus }: { songId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus || "nouveau");
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    const next = CYCLE[status] ?? "en_cours";
    setSaving(true);
    const supabase = createClient();
    await supabase.from("songs").update({ status: next }).eq("id", songId);
    setStatus(next);
    setSaving(false);
  }

  const info = LABELS[status] ?? LABELS.nouveau;

  return (
    <button
      onClick={handleClick}
      disabled={saving}
      title="Cliquer pour changer le statut"
      className="flex-shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all"
      style={{ background: info.bg, color: info.color, border: `1px solid ${info.color}40`, opacity: saving ? 0.6 : 1 }}>
      {info.label}
    </button>
  );
}
