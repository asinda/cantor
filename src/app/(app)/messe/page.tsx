import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, BookOpen, ChevronRight } from "lucide-react";

export default async function MasseSheetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("choir_members").select("choir_id").eq("user_id", user!.id).limit(1).single();

  const choirId = (membership as any)?.choir_id;
  let sheets: any[] = [];

  if (choirId) {
    const { data } = await supabase
      .from("mass_sheets")
      .select("id,title,date,liturgical_season,notes")
      .eq("choir_id", choirId)
      .order("date", { ascending: false });
    sheets = data ?? [];
  }

  const SEASON_COLORS: Record<string, string> = {
    "avent":           "#7F77DD",
    "noël":            "#ef4444",
    "carême":          "#92400e",
    "pâques":          "#d97706",
    "temps ordinaire": "#1D9E75",
    "tous":            "#7F77DD",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Feuilles de messe</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            {sheets.length} {sheets.length === 1 ? "feuille" : "feuilles"}
          </p>
        </div>
        <Link href="/messe/nouveau" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle
        </Link>
      </div>

      {!choirId && (
        <div className="card text-center py-10 space-y-3">
          <BookOpen className="w-10 h-10 mx-auto" style={{ color: "var(--text-3)" }} />
          <p className="font-black text-white">Aucune chorale configurée</p>
          <Link href="/onboarding" className="btn btn-primary inline-flex">Configurer</Link>
        </div>
      )}

      {choirId && sheets.length === 0 && (
        <div className="card text-center py-12 space-y-4">
          <p className="text-4xl">📋</p>
          <div>
            <p className="font-black text-white text-lg">Aucune feuille de messe</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Créez votre première feuille de messe.
            </p>
          </div>
          <Link href="/messe/nouveau" className="btn btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Créer
          </Link>
        </div>
      )}

      {sheets.length > 0 && (
        <div className="card" style={{ padding: "0.5rem" }}>
          {sheets.map((sheet: any, i: number) => {
            const color = SEASON_COLORS[sheet.liturgical_season ?? ""] ?? "#7F77DD";
            return (
              <div key={sheet.id}>
                <Link href={`/messe/${sheet.id}`} className="song-row">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}22` }}>
                    <BookOpen className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{sheet.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                      {sheet.date
                        ? new Date(sheet.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                        : sheet.liturgical_season ?? "—"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                </Link>
                {i < sheets.length - 1 && <div className="divider mx-3" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
