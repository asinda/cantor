import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { LITURGICAL_GRADIENTS, STATUS_BG, LITURGICAL_TYPES } from "@/types";

export default async function SongsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const { q, type } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("choir_members")
    .select("choir_id")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const choirId = (membership as any)?.choir_id;
  let songs: any[] = [];

  if (choirId) {
    let query = supabase
      .from("songs")
      .select("id,title,liturgical_type,status,key_signature,composer,languages")
      .eq("choir_id", choirId)
      .order("title");

    if (q)    query = query.ilike("title", `%${q}%`);
    if (type) query = query.eq("liturgical_type", type);

    const { data } = await query;
    songs = data ?? [];
  }

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Chants</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
            {songs.length} {songs.length === 1 ? "chant" : "chants"}
          </p>
        </div>
        <Link href="/chants/nouveau" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Ajouter
        </Link>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-3)" }} />
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un chant…"
          className="pl-10"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        />
      </form>

      {/* Type filters */}
      <div className="h-scroll">
        <Link href="/chants"
          className={`chip flex-shrink-0 ${!type ? "chip-on" : "chip-off"}`}>
          Tous
        </Link>
        {LITURGICAL_TYPES.map((t) => (
          <Link key={t.value} href={`/chants?type=${t.value}${q ? `&q=${q}` : ""}`}
            className={`chip flex-shrink-0 ${type === t.value ? "chip-on" : "chip-off"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* No choir */}
      {!choirId && (
        <div className="card text-center py-10 space-y-3">
          <p className="text-3xl">🎵</p>
          <p className="font-black text-white">Aucune chorale configurée</p>
          <Link href="/onboarding" className="btn btn-primary inline-flex">Configurer</Link>
        </div>
      )}

      {/* Empty state */}
      {choirId && songs.length === 0 && (
        <div className="card text-center py-12 space-y-4">
          <p className="text-4xl">🎼</p>
          <div>
            <p className="font-black text-white text-lg">Aucun chant trouvé</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              {q || type ? "Modifiez vos filtres ou " : ""}Ajoutez votre premier chant.
            </p>
          </div>
          <Link href="/chants/nouveau" className="btn btn-primary inline-flex">
            <Plus className="w-4 h-4" /> Nouveau chant
          </Link>
        </div>
      )}

      {/* Songs list */}
      {songs.length > 0 && (
        <div className="card" style={{ padding: "0.5rem" }}>
          {songs.map((song: any, i: number) => {
            const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)";
            return (
              <div key={song.id}>
                <Link href={`/chants/${song.id}`} className="song-row">
                  <div className="cover-art flex-shrink-0 font-black"
                    style={{ background: grad, width: 48, height: 48, fontSize: "0.65rem" }}>
                    {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{song.title}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>
                      {[song.composer, song.key_signature].filter(Boolean).join(" · ") || song.liturgical_type || "—"}
                    </p>
                    {song.languages?.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {song.languages.map((lang: string) => (
                          <span key={lang}
                            className="text-xs px-1.5 py-0.5 rounded font-bold uppercase"
                            style={{ background: "var(--surface-3)", color: "var(--text-2)", fontSize: "0.6rem" }}>
                            {lang}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`badge flex-shrink-0 ${STATUS_BG[song.status ?? ""] ?? "bg-gray-900 text-gray-400 border border-gray-700"}`}>
                    {song.status?.replace("_", " ")}
                  </span>
                </Link>
                {i < songs.length - 1 && <div className="divider mx-3" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
