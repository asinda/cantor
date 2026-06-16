import { getAuthContext } from "@/lib/auth";
import { listRehearsals } from "@/services/repetitions";
import Link from "next/link";
import { Plus, Calendar, ChevronRight, MapPin, Clock } from "lucide-react";

export default async function RepetitionsPage() {
  const { choirId } = await getAuthContext();

  const rehearsals: any[] = choirId
    ? (await listRehearsals(choirId)).data ?? []
    : [];

  const now      = new Date();
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
    <div className="max-w-3xl mx-auto px-6 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
          Répétitions
        </h1>
        <Link href="/repetitions/nouveau" className="btn btn-sm"
          style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" /> Planifier
        </Link>
      </div>

      {!choirId && (
        <div className="card text-center py-10 space-y-3">
          <Calendar className="w-10 h-10 mx-auto" style={{ color: "var(--text-3)" }} />
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>Aucune chorale configurée</p>
          <Link href="/onboarding" className="btn btn-sm inline-flex"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
            Configurer
          </Link>
        </div>
      )}

      {choirId && rehearsals.length === 0 && (
        <div className="card text-center py-12 space-y-4">
          <p className="text-4xl">📅</p>
          <div>
            <p className="font-bold text-lg" style={{ color: "var(--text-1)" }}>Aucune répétition planifiée</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Planifiez votre prochaine session de travail.
            </p>
          </div>
          <Link href="/repetitions/nouveau" className="btn btn-sm inline-flex"
            style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
            <Plus className="w-3.5 h-3.5" /> Planifier
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">À venir</h2>
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {upcoming.map((r: any, i: number) => (
              <div key={r.id}>
                <Link href={`/repetitions/${r.id}`} className="content-row">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: isToday(r.date) ? "rgba(251,191,36,0.2)" : "rgba(245,158,11,0.14)",
                      border: isToday(r.date) ? "1px solid rgba(251,191,36,0.35)" : "none" }}>
                    <Calendar className="w-4.5 h-4.5" strokeWidth={2}
                      style={{ color: "#FBBF24" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-1)" }}>
                        {dateLabel(r.date)}
                      </p>
                      {isToday(r.date) && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: "rgba(251,191,36,0.18)", color: "#FBBF24" }}>
                          Aujourd'hui
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      {r.time && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-2)" }}>
                          <Clock className="w-3 h-3" /> {r.time.slice(0,5)}
                        </span>
                      )}
                      {r.location && (
                        <span className="flex items-center gap-1 text-xs truncate" style={{ color: "var(--text-2)" }}>
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {r.location}
                        </span>
                      )}
                      {!r.time && !r.location && r.notes && (
                        <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>{r.notes}</p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                </Link>
                {i < upcoming.length - 1 && <div className="mx-4" style={{ height: 1, background: "var(--border)" }}/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Passées</h2>
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {past.map((r: any, i: number) => (
              <div key={r.id}>
                <Link href={`/repetitions/${r.id}`} className="content-row">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface-2)" }}>
                    <Calendar className="w-4 h-4" style={{ color: "var(--text-3)" }} strokeWidth={2}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium capitalize" style={{ color: "var(--text-1)" }}>
                      {dateLabel(r.date)}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {r.time && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-2)" }}>
                          <Clock className="w-3 h-3" /> {r.time.slice(0,5)}
                        </span>
                      )}
                      {r.location && (
                        <span className="flex items-center gap-1 text-xs truncate" style={{ color: "var(--text-2)" }}>
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {r.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
                </Link>
                {i < past.length - 1 && <div className="mx-4" style={{ height: 1, background: "var(--border)" }}/>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
