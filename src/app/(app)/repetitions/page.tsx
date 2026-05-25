import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Calendar, ChevronRight } from "lucide-react";

export default async function RepetitionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("choir_members").select("choir_id").eq("user_id", user!.id).limit(1).single();

  const choirId = (membership as any)?.choir_id;
  let rehearsals: any[] = [];

  if (choirId) {
    const { data } = await supabase
      .from("rehearsals")
      .select("id,date,notes")
      .eq("choir_id", choirId)
      .order("date", { ascending: false });
    rehearsals = data ?? [];
  }

  const now   = new Date();
  const upcoming = rehearsals.filter((r) => new Date(r.date) >= now);
  const past     = rehearsals.filter((r) => new Date(r.date) <  now);

  function dateLabel(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function isToday(dateStr: string) {
    const d = new Date(dateStr);
    return d.toDateString() === now.toDateString();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Répétitions</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            {rehearsals.length} {rehearsals.length === 1 ? "répétition" : "répétitions"}
          </p>
        </div>
        <Link href="/repetitions/nouveau" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Planifier
        </Link>
      </div>

      {!choirId && (
        <div className="card text-center py-10 space-y-3">
          <Calendar className="w-10 h-10 mx-auto" style={{ color: "var(--text-3)" }} />
          <p className="font-black text-white">Aucune chorale configurée</p>
          <Link href="/onboarding" className="btn btn-primary inline-flex">Configurer</Link>
        </div>
      )}

      {choirId && rehearsals.length === 0 && (
        <div className="card text-center py-12 space-y-4">
          <p className="text-4xl">📅</p>
          <div>
            <p className="font-black text-white text-lg">Aucune répétition planifiée</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Planifiez votre prochaine session de travail.
            </p>
          </div>
          <Link href="/repetitions/nouveau" className="btn btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Planifier
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">À venir</h2>
          </div>
          <div className="space-y-2.5">
            {upcoming.map((r: any) => (
              <Link key={r.id} href={`/repetitions/${r.id}`}
                className="card flex items-center gap-4 hover:border-opacity-30 transition-all active:scale-[0.99]"
                style={{
                  padding: "0.875rem 1rem",
                  borderColor: isToday(r.date) ? "rgba(127,119,221,0.4)" : undefined,
                }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isToday(r.date) ? "var(--violet-dim)" : "rgba(245,158,11,0.15)" }}>
                  <Calendar className="w-5 h-5"
                    style={{ color: isToday(r.date) ? "#7F77DD" : "#F59E0B" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-white capitalize">{dateLabel(r.date)}</p>
                    {isToday(r.date) && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: "var(--violet-dim)", color: "#7F77DD" }}>
                        Aujourd'hui
                      </span>
                    )}
                  </div>
                  {r.notes && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{r.notes}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Passées</h2>
          </div>
          <div className="card" style={{ padding: "0.5rem" }}>
            {past.map((r: any, i: number) => (
              <div key={r.id}>
                <Link href={`/repetitions/${r.id}`} className="song-row">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-3)" }}>
                    <Calendar className="w-4 h-4" style={{ color: "var(--text-3)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white capitalize">{dateLabel(r.date)}</p>
                    {r.notes && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{r.notes}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                </Link>
                {i < past.length - 1 && <div className="divider mx-3" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
