"use client";
import { useState } from "react";
import { CheckCircle, XCircle, Loader2, MessageSquare } from "lucide-react";
import { validateSongAction, rejectSongAction } from "@/actions/validation";
import { useRouter } from "next/navigation";

interface Props {
  songId: string;
  showValidateOnly?: boolean;
}

export default function ValidationActions({ songId, showValidateOnly = false }: Props) {
  const router = useRouter();
  const [loading,    setLoading]    = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [note,       setNote]       = useState("");
  const [msg,        setMsg]        = useState("");

  async function handleValidate() {
    setLoading(true); setMsg("");
    const res = await validateSongAction(songId);
    if ("error" in res) { setMsg(res.error ?? "Erreur"); setLoading(false); return; }
    router.refresh();
  }

  async function handleReject() {
    if (!note.trim()) { setMsg("Veuillez indiquer la raison du rejet."); return; }
    setLoading(true); setMsg("");
    const res = await rejectSongAction(songId, note.trim());
    if ("error" in res) { setMsg(res.error ?? "Erreur"); setLoading(false); return; }
    setShowReject(false); setNote(""); router.refresh();
  }

  if (showReject) {
    return (
      <div className="space-y-2">
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Motif du rejet (obligatoire) : manque de paroles, mauvaise classification…"
          rows={3}
          autoFocus
        />
        {msg && <p className="text-xs" style={{ color: "var(--red)" }}>{msg}</p>}
        <div className="flex gap-2">
          <button onClick={handleReject} disabled={loading}
            className="btn btn-danger btn-sm flex-1 justify-center">
            {loading ? <Loader2 className="w-4 h-4 spin" /> : <XCircle className="w-4 h-4" />}
            Confirmer le rejet
          </button>
          <button onClick={() => { setShowReject(false); setMsg(""); }}
            className="btn btn-secondary btn-sm flex-shrink-0">
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <button onClick={handleValidate} disabled={loading}
        className="btn btn-sm flex-1 justify-center"
        style={{ background: "rgba(74,124,89,0.12)", color: "#4A7C59",
          border: "1px solid rgba(74,124,89,0.25)" }}>
        {loading ? <Loader2 className="w-4 h-4 spin" /> : <CheckCircle className="w-4 h-4" />}
        Valider
      </button>
      {!showValidateOnly && (
        <button onClick={() => setShowReject(true)} disabled={loading}
          className="btn btn-sm flex-1 justify-center"
          style={{ background: "rgba(155,28,28,0.08)", color: "#9B1C1C",
            border: "1px solid rgba(155,28,28,0.2)" }}>
          <MessageSquare className="w-4 h-4" /> Rejeter avec note
        </button>
      )}
      {msg && <p className="text-xs w-full" style={{ color: "var(--red)" }}>{msg}</p>}
    </div>
  );
}
