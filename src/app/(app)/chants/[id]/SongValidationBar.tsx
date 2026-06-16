"use client";
import { useState } from "react";
import { CheckCircle, Clock, XCircle, Send, RotateCcw, Loader2 } from "lucide-react";
import {
  submitSongForValidationAction,
  resetSongToDraftAction,
  validateSongAction,
  rejectSongAction,
} from "@/actions/validation";
import { VALIDATION_STYLE, type ValidationStatus } from "@/types";
import { useRouter } from "next/navigation";

interface Props {
  songId: string;
  status: ValidationStatus;
  rejectionNote?: string | null;
  isChef: boolean;
}

export default function SongValidationBar({ songId, status, rejectionNote, isChef }: Props) {
  const router         = useRouter();
  const [loading, setL] = useState(false);
  const [showReject,setR]= useState(false);
  const [note,    setN]  = useState("");
  const [msg,     setM]  = useState("");

  const style = VALIDATION_STYLE[status];

  async function act(fn: () => Promise<any>) {
    setL(true); setM("");
    const res = await fn();
    if (res && "error" in res) { setM(res.error); setL(false); return; }
    router.refresh();
  }

  return (
    <div className="card" style={{ padding: "1rem" }}>
      {/* Statut actuel */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {status === "validé"     && <CheckCircle className="w-4 h-4" style={{ color: style.color }} />}
          {status === "en_attente" && <Clock className="w-4 h-4"       style={{ color: style.color }} />}
          {status === "rejeté"     && <XCircle className="w-4 h-4"     style={{ color: style.color }} />}
          {status === "brouillon"  && <Clock className="w-4 h-4"       style={{ color: style.color }} />}
          <span className="text-sm font-semibold" style={{ color: style.color }}>
            {style.label}
          </span>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-medium"
          style={{ background: style.bg, color: style.color }}>
          Statut de validation
        </span>
      </div>

      {/* Note de rejet */}
      {status === "rejeté" && rejectionNote && (
        <div className="mb-3 px-3 py-2 rounded-lg text-sm leading-relaxed"
          style={{ background: "rgba(155,28,28,0.06)", borderLeft: "3px solid #9B1C1C",
            color: "var(--text-2)" }}>
          <span className="font-semibold text-xs uppercase tracking-wide" style={{ color: "#9B1C1C" }}>
            Motif du rejet :{" "}
          </span>
          {rejectionNote}
        </div>
      )}

      {/* Actions selon rôle et statut */}
      <div className="space-y-2">

        {/* Choriste : soumettre ou repasser en brouillon */}
        {!isChef && status === "brouillon" && (
          <button onClick={() => act(() => submitSongForValidationAction(songId))}
            disabled={loading}
            className="btn btn-primary btn-sm w-full justify-center">
            {loading ? <Loader2 className="w-4 h-4 spin" /> : <Send className="w-4 h-4" />}
            Soumettre à la validation
          </button>
        )}

        {!isChef && status === "rejeté" && (
          <button onClick={() => act(() => resetSongToDraftAction(songId))}
            disabled={loading}
            className="btn btn-secondary btn-sm w-full justify-center">
            {loading ? <Loader2 className="w-4 h-4 spin" /> : <RotateCcw className="w-4 h-4" />}
            Reprendre en brouillon
          </button>
        )}

        {/* Chef : valider / rejeter */}
        {isChef && (status === "en_attente" || status === "brouillon") && !showReject && (
          <div className="flex gap-2">
            <button onClick={() => act(() => validateSongAction(songId))}
              disabled={loading}
              className="btn btn-sm flex-1 justify-center"
              style={{ background: "rgba(74,124,89,0.12)", color: "#4A7C59",
                border: "1px solid rgba(74,124,89,0.25)" }}>
              {loading ? <Loader2 className="w-4 h-4 spin" /> : <CheckCircle className="w-4 h-4" />}
              Valider
            </button>
            <button onClick={() => setR(true)} disabled={loading}
              className="btn btn-sm flex-1 justify-center"
              style={{ background: "rgba(155,28,28,0.08)", color: "#9B1C1C",
                border: "1px solid rgba(155,28,28,0.2)" }}>
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
          </div>
        )}

        {isChef && status === "rejeté" && !showReject && (
          <button onClick={() => act(() => validateSongAction(songId))} disabled={loading}
            className="btn btn-sm w-full justify-center"
            style={{ background: "rgba(74,124,89,0.12)", color: "#4A7C59",
              border: "1px solid rgba(74,124,89,0.25)" }}>
            {loading ? <Loader2 className="w-4 h-4 spin" /> : <CheckCircle className="w-4 h-4" />}
            Valider quand même
          </button>
        )}

        {/* Formulaire de rejet */}
        {showReject && (
          <div className="space-y-2">
            <textarea value={note} onChange={e => setN(e.target.value)} autoFocus
              placeholder="Motif du rejet (sera visible par le choriste)…" rows={3} />
            <div className="flex gap-2">
              <button onClick={() => act(() => rejectSongAction(songId, note.trim()))}
                disabled={loading || !note.trim()}
                className="btn btn-danger btn-sm flex-1 justify-center">
                {loading ? <Loader2 className="w-4 h-4 spin" /> : <XCircle className="w-4 h-4" />}
                Confirmer
              </button>
              <button onClick={() => { setR(false); setN(""); }}
                className="btn btn-secondary btn-sm flex-shrink-0">Annuler</button>
            </div>
          </div>
        )}

        {msg && <p className="text-xs" style={{ color: "var(--red)" }}>{msg}</p>}
      </div>
    </div>
  );
}
