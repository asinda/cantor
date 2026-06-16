import { getAuthContext } from "@/lib/auth";
import { listMassSheets } from "@/services/messe";
import Link from "next/link";
import { Plus, BookOpen, ChevronRight } from "lucide-react";

const SEASON_GRAD: Record<string, string> = {
  "avent":           "linear-gradient(135deg, #4A1080, #8B5CF6)",
  "noël":            "linear-gradient(135deg, #991B1B, #ef4444)",
  "carême":          "linear-gradient(135deg, #78350F, #d97706)",
  "pâques":          "linear-gradient(135deg, #d97706, #F0B429)",
  "temps ordinaire": "linear-gradient(135deg, #15803D, #22C55E)",
  "tous":            "linear-gradient(135deg, #8B5CF6, #F0B429)",
};

const SEASON_COLOR: Record<string, string> = {
  "avent":           "#8B5CF6",
  "noël":            "#ef4444",
  "carême":          "#d97706",
  "pâques":          "#F0B429",
  "temps ordinaire": "#22C55E",
  "tous":            "#8B5CF6",
};

export default async function MasseSheetsPage() {
  const { choirId } = await getAuthContext();

  const sheets: any[] = choirId
    ? (await listMassSheets(choirId)).data ?? []
    : [];

  return (
    <div className="max-w-3xl mx-auto px-6 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
          Feuilles de messe
        </h1>
        <Link href="/messe/nouveau" className="btn btn-sm"
          style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" /> Nouvelle
        </Link>
      </div>

      {!choirId && (
        <div className="card text-center py-10 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto" style={{ color: "var(--text-3)" }} />
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>Aucune chorale configurée</p>
          <Link href="/onboarding" className="btn btn-sm inline-flex"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
            Configurer
          </Link>
        </div>
      )}

      {choirId && sheets.length === 0 && (
        <div className="card text-center py-12 space-y-4">
          <p className="text-4xl">📋</p>
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--text-1)" }}>Aucune feuille de messe</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Créez votre première feuille de messe.
            </p>
          </div>
          <Link href="/messe/nouveau" className="btn btn-sm inline-flex"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
            <Plus className="w-3.5 h-3.5" /> Créer
          </Link>
        </div>
      )}

      {sheets.length > 0 && (
        <div className="rounded-2xl overflow-hidden"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {sheets.map((sheet: any, i: number) => {
            const grad  = SEASON_GRAD[sheet.liturgical_season ?? ""] ?? SEASON_GRAD["tous"];
            const color = SEASON_COLOR[sheet.liturgical_season ?? ""] ?? SEASON_COLOR["tous"];
            return (
              <div key={sheet.id}>
                <Link href={`/messe/${sheet.id}`} className="content-row">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: grad }}>
                    <BookOpen className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                      {sheet.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {sheet.date && (
                        <p className="text-xs" style={{ color: "var(--text-2)" }}>
                          {new Date(sheet.date).toLocaleDateString("fr-FR",
                            { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                      {sheet.liturgical_season && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold capitalize"
                          style={{ background: `${color}18`, color }}>
                          {sheet.liturgical_season}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                </Link>
                {i < sheets.length - 1 && (
                  <div className="mx-4" style={{ height: 1, background: "var(--border)" }}/>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
