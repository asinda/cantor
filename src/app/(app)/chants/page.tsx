import { getAuthContext } from "@/lib/auth";
import { listSongsFiltered } from "@/services/songs";
import Link from "next/link";
import { Plus, Search, X, Play } from "lucide-react";
import { LITURGICAL_GRADIENTS, LITURGICAL_TYPES, SONG_STATUSES } from "@/types";

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  nouveau:  { bg: "rgba(168,137,106,0.14)", color: "#A8896A", label: "Nouveau"  },
  en_cours: { bg: "rgba(251,191,36,0.14)",  color: "#FBBF24", label: "En cours" },
  appris:   { bg: "rgba(110,231,183,0.14)", color: "#6EE7B7", label: "Appris"   },
};

const GENRE_COLORS: Record<string, string> = {
  "entrée":     "linear-gradient(135deg,#7c3aed,#db2777)",
  "kyrie":      "linear-gradient(135deg,#374151,#6B7280)",
  "gloria":     "linear-gradient(135deg,#d97706,#ea580c)",
  "psaume":     "linear-gradient(135deg,#059669,#0d9488)",
  "alléluia":   "linear-gradient(135deg,#b45309,#d97706)",
  "offertoire": "linear-gradient(135deg,#0284c7,#0891b2)",
  "sanctus":    "linear-gradient(135deg,#2563eb,#4f46e5)",
  "agnus dei":  "linear-gradient(135deg,#dc2626,#be185d)",
  "notre père": "linear-gradient(135deg,#0f766e,#0d9488)",
  "communion":  "linear-gradient(135deg,#16a34a,#059669)",
  "sortie":     "linear-gradient(135deg,#4f46e5,#7c3aed)",
};

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const { q, type, status } = await searchParams;
  const { choirId } = await getAuthContext();

  const songs: any[] = choirId
    ? (await listSongsFiltered(choirId, { q, type, status })).data ?? []
    : [];

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;
  const hasFilters = !!(q || type || status);

  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { q, type, status, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    const s = params.toString();
    return `/chants${s ? `?${s}` : ""}`;
  }

  return (
    <div className="max-w-3xl mx-auto px-6 pt-6 pb-28 space-y-5 fade-in">

      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>
          Bibliothèque
        </h1>
        <Link href="/chants/nouveau" className="btn btn-sm"
          style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Link>
      </div>

      {/* Recherche */}
      <form method="GET" className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          style={{ color: "var(--text-3)" }} />
        <input name="q" defaultValue={q} placeholder="Titres, compositeurs, types…" className="pl-10 pr-8" />
        {type   && <input type="hidden" name="type"   value={type} />}
        {status && <input type="hidden" name="status" value={status} />}
        {q && (
          <Link href={buildHref({ q: undefined })}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}>
            <X className="w-4 h-4" />
          </Link>
        )}
      </form>

      {/* Onglets statut */}
      <div className="lib-tabs">
        <Link href={buildHref({ status: undefined })}
          className={`lib-tab ${!status ? "lib-tab-on" : "lib-tab-off"}`}>Tout</Link>
        {SONG_STATUSES.map(s => (
          <Link key={s} href={buildHref({ status: status === s ? undefined : s })}
            className={`lib-tab ${status === s ? "lib-tab-on" : "lib-tab-off"}`}>
            {STATUS_STYLE[s]?.label ?? s}
          </Link>
        ))}
      </div>

      {/* Genres */}
      {!hasFilters && choirId && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--text-3)" }}>Parcourir par type</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
            {LITURGICAL_TYPES.map(t => (
              <Link key={t.value} href={buildHref({ type: t.value })}
                className="genre-tile"
                style={{ background: GENRE_COLORS[t.value] ?? "var(--surface-2)" }}>
                <span className="genre-tile-label">{t.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Type actif */}
      {type && (
        <Link href={buildHref({ type: undefined })}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
          style={{ background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border-2)" }}>
          <span className="capitalize">{type}</span>
          <X className="w-3.5 h-3.5" />
        </Link>
      )}

      {/* Vide */}
      {choirId && songs.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">🎼</div>
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>
            {hasFilters ? "Aucun résultat" : "Bibliothèque vide"}
          </p>
          <div className="flex gap-2 justify-center">
            {hasFilters && (
              <Link href="/chants" className="btn btn-secondary btn-sm">
                <X className="w-3.5 h-3.5" /> Réinitialiser
              </Link>
            )}
            {!hasFilters && (
              <Link href="/chants/nouveau" className="btn btn-sm"
                style={{ background: "linear-gradient(135deg,#F59E0B,#D97706)", color: "#0C0906", fontWeight: 700 }}>
                <Plus className="w-3.5 h-3.5" /> Premier chant
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Liste */}
      {songs.length > 0 && (
        <div>
          <p className="text-xs mb-3" style={{ color: "var(--text-3)" }}>
            {songs.length} {songs.length === 1 ? "chant" : "chants"}
          </p>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            {songs.map((song: any, i: number) => {
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#201A12,#342C22)";
              const st   = STATUS_STYLE[song.status ?? ""];
              return (
                <div key={song.id}>
                  <Link href={`/chants/${song.id}`} className="content-row">
                    <div className="content-row-thumb" style={{ background: grad, width: 44, height: 44 }}>
                      {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-1)" }}>
                        {song.title}
                      </p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>
                        {song.composer || song.liturgical_type || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {st && (
                        <span className="badge" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      )}
                      <button className="play-btn">
                        <Play className="w-4 h-4 text-white ml-0.5" fill="white"/>
                      </button>
                    </div>
                  </Link>
                  {i < songs.length - 1 && (
                    <div className="mx-4" style={{ height: 1, background: "var(--border)" }}/>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
