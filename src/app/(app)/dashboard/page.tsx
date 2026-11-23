import { getAuthContext } from "@/lib/auth";
import Link from "next/link";
import { Plus, Music } from "lucide-react";
import AccueilDashboard from "./AccueilDashboard";

export default async function DashboardPage() {
  const { userId, userName, choirId, choirName } = await getAuthContext();

  // Même accueil pour tous les rôles
  if (choirId) {
    return (
      <AccueilDashboard userId={userId} choirId={choirId}
        firstName={userName?.split(" ")[0] ?? null} choirName={choirName} />
    );
  }

  /* ══ PAS DE CHORALE ══ */
  return (
    <div className="px-5 pt-5 pb-8 max-w-6xl mx-auto fade-in">
      <div className="card text-center py-16 max-w-md mx-auto space-y-4">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
          <Music className="w-6 h-6" style={{ color: "var(--gold)" }} />
        </div>
        <div>
          <p className="text-lg font-bold" style={{ color: "var(--text-1)" }}>
            Bienvenue sur Cantor
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Gérez votre répertoire, vos répétitions et vos feuilles de messe.
          </p>
        </div>
        <Link href="/onboarding" className="btn btn-primary inline-flex">
          <Plus className="w-4 h-4" /> Configurer ma chorale
        </Link>
      </div>
    </div>
  );
}
