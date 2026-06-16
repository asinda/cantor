import { getAuthContext } from "@/lib/auth";
import { listPendingSongs } from "@/services/validation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, CheckCircle, XCircle, Music, AlertCircle } from "lucide-react";
import ValidationActions from "./ValidationActions";
import { LITURGICAL_GRADIENTS } from "@/types";

export default async function ValidationPage() {
  const { userId, choirId } = await getAuthContext();

  // Récupérer le rôle de l'utilisateur
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("choir_members")
    .select("role")
    .eq("user_id", userId)
    .eq("choir_id", choirId ?? "")
    .single();

  if (!member || member.role !== "chef") {
    return (
      <div className="max-w-2xl mx-auto px-5 pt-8 pb-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 mx-auto" style={{ color: "var(--red)" }} />
        <p className="font-semibold" style={{ color: "var(--text-1)" }}>
          Accès réservé au chef de chœur
        </p>
        <Link href="/chants" className="btn btn-secondary inline-flex">
          ← Retour à la bibliothèque
        </Link>
      </div>
    );
  }

  const { data: songs } = await listPendingSongs(choirId ?? "");
  const pending  = (songs ?? []).filter(s => s.validation_status === "en_attente");
  const rejected = (songs ?? []).filter(s => s.validation_status === "rejeté");
  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;

  return (
    <div className="max-w-3xl mx-auto px-5 pt-5 pb-20 space-y-6 fade-in">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/chants" className="flex items-center gap-2 text-sm"
            style={{ color: "var(--text-2)" }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
              Validation des chants
            </h1>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              {pending.length} en attente · {rejected.length} rejetés
            </p>
          </div>
        </div>
      </div>

      {/* Aucun chant en attente */}
      {pending.length === 0 && rejected.length === 0 && (
        <div className="card text-center py-12 space-y-3">
          <CheckCircle className="w-10 h-10 mx-auto" style={{ color: "var(--green)" }} />
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>
            Tout est validé !
          </p>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Aucun chant en attente de validation.
          </p>
        </div>
      )}

      {/* En attente */}
      {pending.length > 0 && (
        <div>
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "#A0621A" }} />
              <h2 className="section-title">En attente de validation ({pending.length})</h2>
            </div>
          </div>
          <div className="space-y-3">
            {pending.map((song: any) => {
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#5C3200,#A0621A)";
              return (
                <div key={song.id} className="card" style={{ padding: "1rem" }}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex-shrink-0"
                      style={{ background: grad }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: "var(--text-1)" }}>{song.title}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(160,98,26,0.12)", color: "#A0621A" }}>
                          En attente
                        </span>
                      </div>
                      {song.liturgical_type && (
                        <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-2)" }}>
                          {song.liturgical_type}
                          {song.composer ? ` · ${song.composer}` : ""}
                        </p>
                      )}
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                        Ajouté le {new Date(song.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                      </p>
                    </div>
                    <Link href={`/chants/${song.id}`}
                      className="btn btn-secondary btn-sm flex-shrink-0">
                      Voir
                    </Link>
                  </div>
                  <ValidationActions songId={song.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejetés */}
      {rejected.length > 0 && (
        <div>
          <div className="section-header">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" style={{ color: "#9B1C1C" }} />
              <h2 className="section-title">Rejetés ({rejected.length})</h2>
            </div>
          </div>
          <div className="space-y-3">
            {rejected.map((song: any) => {
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#5C3200,#A0621A)";
              return (
                <div key={song.id} className="card" style={{ padding: "1rem" }}>
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex-shrink-0"
                      style={{ background: grad }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold" style={{ color: "var(--text-1)" }}>{song.title}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: "rgba(155,28,28,0.1)", color: "#9B1C1C" }}>
                          Rejeté
                        </span>
                      </div>
                      {song.rejection_note && (
                        <div className="mt-2 px-3 py-2 rounded-lg text-xs leading-relaxed"
                          style={{ background: "rgba(155,28,28,0.06)", borderLeft: "3px solid #9B1C1C",
                            color: "var(--text-2)" }}>
                          {song.rejection_note}
                        </div>
                      )}
                    </div>
                    <Link href={`/chants/${song.id}`}
                      className="btn btn-secondary btn-sm flex-shrink-0">
                      Voir
                    </Link>
                  </div>
                  {/* Permettre de valider quand même */}
                  <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <ValidationActions songId={song.id} showValidateOnly />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
