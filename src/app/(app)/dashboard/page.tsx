import { getAuthContext } from "@/lib/auth";
import { getRecentSongs, countSongs } from "@/services/songs";
import { getRecentRehearsals, countRehearsals } from "@/services/repetitions";
import { getRecentMassSheets, countMassSheets } from "@/services/messe";
import Link from "next/link";
import { ChevronRight, Plus, Music, Calendar, BookOpen, ArrowRight } from "lucide-react";
import { LITURGICAL_GRADIENTS } from "@/types";

export default async function DashboardPage() {
  const { userName, choirId, choirName } = await getAuthContext();

  let songs: any[] = [], rehearsals: any[] = [], sheets: any[] = [];
  let songsTotal = 0, rehearsalsTotal = 0, sheetsTotal = 0;

  if (choirId) {
    const [r0, r1, r2, c0, c1, c2] = await Promise.all([
      getRecentSongs(choirId, 8),
      getRecentRehearsals(choirId, 5),
      getRecentMassSheets(choirId, 5),
      countSongs(choirId),
      countRehearsals(choirId),
      countMassSheets(choirId),
    ]);
    songs = r0.data ?? []; rehearsals = r1.data ?? []; sheets = r2.data ?? [];
    songsTotal = c0; rehearsalsTotal = c1; sheetsTotal = c2;
  }

  const firstName = userName?.split(" ")[0] ?? "là";
  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const now  = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const dateStr  = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const nextRehearsal = rehearsals.find(r => new Date(r.date) >= now);

  return (
    <div className="px-5 pt-5 pb-8 max-w-6xl mx-auto fade-in">

      {/* ══ HEADER ══ */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-medium capitalize" style={{ color: "var(--text-3)" }}>
            {dateStr}
          </p>
          <h1 className="text-xl font-bold mt-0.5" style={{ color: "var(--text-1)" }}>
            {greeting}{firstName !== "là" ? `, ${firstName}` : ""}
            {choirName && <span className="font-normal ml-1.5" style={{ color: "var(--text-2)" }}>— {choirName}</span>}
          </h1>
        </div>
        {choirId && (
          <div className="flex gap-2">
            <Link href="/repetitions/nouveau" className="btn btn-secondary btn-sm">
              <Calendar className="w-3.5 h-3.5" /> Répétition
            </Link>
            <Link href="/chants/nouveau" className="btn btn-primary btn-sm">
              <Plus className="w-3.5 h-3.5" /> Chant
            </Link>
          </div>
        )}
      </div>

      {/* ══ PAS DE CHORALE ══ */}
      {!choirId && (
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
      )}

      {choirId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ══ COLONNE PRINCIPALE (2/3) ══ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Stats + prochaine répétition ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Chants",   value: songsTotal,     href: "/chants",
                  grad: "linear-gradient(135deg,#5C3200,#A0621A)", icon: Music },
                { label: "Feuilles", value: sheetsTotal,    href: "/messe",
                  grad: "linear-gradient(135deg,#1E3D2C,#4A7C59)", icon: BookOpen },
                { label: "Répét.",   value: rehearsalsTotal,href: "/repetitions",
                  grad: "linear-gradient(135deg,#6B3A00,#B05C10)", icon: Calendar },
              ].map(({ label, value, href, grad, icon: Icon }) => (
                <Link key={label} href={href} className="stat-card" style={{ background: grad }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.15)" }}>
                    <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none">{value}</p>
                    <p className="text-xs mt-0.5 font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── Prochaine répétition ── */}
            {nextRehearsal && (
              <Link href={`/repetitions/${nextRehearsal.id}`}
                className="card flex items-center gap-4"
                style={{ padding: "1rem 1.25rem" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--gold-dim)", border: "1px solid var(--gold-border)" }}>
                  <Calendar className="w-4.5 h-4.5" style={{ color: "var(--gold)" }} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--gold)" }}>
                    Prochaine répétition
                  </p>
                  <p className="text-sm font-semibold capitalize mt-0.5" style={{ color: "var(--text-1)" }}>
                    {new Date(nextRehearsal.date).toLocaleDateString("fr-FR",
                      { weekday: "long", day: "numeric", month: "long" })}
                    {" · "}{new Date(nextRehearsal.date).toLocaleTimeString("fr-FR",
                      { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-3)" }} />
              </Link>
            )}

            {/* ── Chants récents ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold" style={{ color: "var(--text-2)" }}>
                  CHANTS RÉCENTS
                </h2>
                <Link href="/chants" className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--gold)" }}>
                  Voir tout <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {songs.length === 0 ? (
                <div className="card text-center py-10 space-y-3">
                  <p className="text-2xl">🎵</p>
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucun chant pour l'instant</p>
                  <Link href="/chants/nouveau" className="btn btn-primary btn-sm inline-flex">
                    <Plus className="w-3.5 h-3.5" /> Ajouter
                  </Link>
                </div>
              ) : (
                <div className="card" style={{ padding: "0.375rem" }}>
                  {songs.map((song: any, i: number) => {
                    const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#4A3020,#6B5030)";
                    const statusColor: Record<string, string> = {
                      appris: "#4A7C59", en_cours: "#A0621A", nouveau: "var(--text-3)"
                    };
                    return (
                      <div key={song.id}>
                        <Link href={`/chants/${song.id}`} className="content-row">
                          <div className="content-row-thumb" style={{ background: grad, width: 42, height: 42 }}>
                            {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>
                              {song.title}
                            </p>
                            <p className="text-xs truncate" style={{ color: "var(--text-2)" }}>
                              {song.composer || song.liturgical_type || "—"}
                            </p>
                          </div>
                          {song.status && (
                            <span className="text-xs font-medium flex-shrink-0"
                              style={{ color: statusColor[song.status] ?? "var(--text-3)" }}>
                              {song.status === "en_cours" ? "En cours" : song.status === "appris" ? "Appris" : "Nouveau"}
                            </span>
                          )}
                          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 ml-1" style={{ color: "var(--text-3)" }} />
                        </Link>
                        {i < songs.length - 1 && (
                          <div className="mx-4" style={{ height: 1, background: "var(--border)" }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ══ COLONNE SECONDAIRE (1/3) ══ */}
          <div className="space-y-5">

            {/* ── Actions rapides ── */}
            <div>
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                Actions rapides
              </h2>
              <div className="space-y-2">
                {[
                  { href: "/chants/nouveau",     label: "Nouveau chant",     icon: Music,    color: "#6B3800" },
                  { href: "/messe/nouveau",       label: "Nouvelle feuille",  icon: BookOpen, color: "#4A7C59" },
                  { href: "/repetitions/nouveau", label: "Planifier répétition",icon: Calendar, color: "#A0621A" },
                ].map(({ href, label, icon: Icon, color }) => (
                  <Link key={href} href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ background: `${color}12` }}>
                      <Icon className="w-3.5 h-3.5" strokeWidth={2} style={{ color }} />
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--text-1)" }}>{label}</span>
                    <Plus className="w-3.5 h-3.5 ml-auto flex-shrink-0" style={{ color: "var(--text-3)" }} />
                  </Link>
                ))}
              </div>
            </div>

            {/* ── Feuilles de messe ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                  Feuilles de messe
                </h2>
                <Link href="/messe" className="text-xs font-medium" style={{ color: "var(--gold)" }}>
                  Tout →
                </Link>
              </div>
              {sheets.length === 0 ? (
                <div className="card py-6 text-center">
                  <p className="text-sm" style={{ color: "var(--text-2)" }}>Aucune feuille</p>
                  <Link href="/messe/nouveau"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-medium"
                    style={{ color: "var(--gold)" }}>
                    <Plus className="w-3 h-3" /> Créer
                  </Link>
                </div>
              ) : (
                <div className="card" style={{ padding: "0.375rem" }}>
                  {sheets.slice(0, 4).map((s: any, i: number) => (
                    <div key={s.id}>
                      <Link href={`/messe/${s.id}`} className="content-row">
                        <div className="content-row-thumb flex items-center justify-center"
                          style={{ background: "linear-gradient(135deg,#1E3D2C,#4A7C59)", width: 38, height: 38 }}>
                          <BookOpen className="w-3.5 h-3.5 text-white" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--text-1)" }}>{s.title}</p>
                          {s.date && (
                            <p className="text-xs capitalize" style={{ color: "var(--text-2)" }}>
                              {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                            </p>
                          )}
                        </div>
                      </Link>
                      {i < Math.min(sheets.length, 4) - 1 && (
                        <div className="mx-3" style={{ height: 1, background: "var(--border)" }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Répétitions passées ── */}
            {rehearsals.filter(r => new Date(r.date) < now).length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    Répétitions passées
                  </h2>
                  <Link href="/repetitions" className="text-xs font-medium" style={{ color: "var(--gold)" }}>
                    Tout →
                  </Link>
                </div>
                <div className="card" style={{ padding: "0.375rem" }}>
                  {rehearsals.filter(r => new Date(r.date) < now).slice(0, 3).map((r: any, i: number, arr: any[]) => (
                    <div key={r.id}>
                      <Link href={`/repetitions/${r.id}`} className="content-row">
                        <div className="content-row-thumb flex items-center justify-center"
                          style={{ background: "var(--surface-2)", width: 38, height: 38,
                            border: "1px solid var(--border)" }}>
                          <Calendar className="w-3.5 h-3.5" style={{ color: "var(--text-3)" }} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize" style={{ color: "var(--text-1)" }}>
                            {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </Link>
                      {i < arr.length - 1 && (
                        <div className="mx-3" style={{ height: 1, background: "var(--border)" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
