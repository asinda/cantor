import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, ChevronRight, Music, Calendar, BookOpen, Play } from "lucide-react";
import { LITURGICAL_GRADIENTS, STATUS_BG } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("choir_members")
    .select("choir_id, choirs(id, name)")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const choirId = (membership as any)?.choir_id;

  let songs: any[] = [], rehearsals: any[] = [], sheets: any[] = [];
  let songsTotal = 0, rehearsalsTotal = 0, sheetsTotal = 0;

  if (choirId) {
    const [r0, r1, r2, c0, c1, c2] = await Promise.all([
      supabase.from("songs").select("id,title,liturgical_type,status,key_signature,composer").eq("choir_id", choirId).order("updated_at", { ascending: false }).limit(6),
      supabase.from("rehearsals").select("id,date,notes").eq("choir_id", choirId).order("date", { ascending: false }).limit(3),
      supabase.from("mass_sheets").select("id,title,date").eq("choir_id", choirId).order("created_at", { ascending: false }).limit(3),
      supabase.from("songs").select("*", { count: "exact", head: true }).eq("choir_id", choirId),
      supabase.from("rehearsals").select("*", { count: "exact", head: true }).eq("choir_id", choirId),
      supabase.from("mass_sheets").select("*", { count: "exact", head: true }).eq("choir_id", choirId),
    ]);
    songs            = r0.data ?? [];
    rehearsals       = r1.data ?? [];
    sheets           = r2.data ?? [];
    songsTotal       = c0.count ?? 0;
    rehearsalsTotal  = c1.count ?? 0;
    sheetsTotal      = c2.count ?? 0;
  }

  const name      = user?.user_metadata?.full_name?.split(" ")[0] ?? "Chantre";
  const choirName = (membership as any)?.choirs?.name;

  const GRAD: Record<string, string> = LITURGICAL_GRADIENTS;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-7 fade-in">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Bonjour, {name} 👋</p>
          <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">
            {choirName ?? "Cantor"}
          </h1>
        </div>
        <Link href="/chants/nouveau" className="btn btn-primary text-sm">
          <Plus className="w-4 h-4" /> Nouveau
        </Link>
      </div>

      {/* No choir */}
      {!choirId && (
        <div className="card text-center py-12 space-y-4">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7F77DD, #1D9E75)" }}>
            <Music className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-lg">Rejoignez une chorale</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Créez ou rejoignez une chorale pour commencer.
            </p>
          </div>
          <Link href="/onboarding" className="btn btn-primary inline-flex">
            Configurer ma chorale
          </Link>
        </div>
      )}

      {/* Stats */}
      {choirId && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Chants",       value: songsTotal,       icon: Music,    href: "/chants",       color: "#7F77DD" },
            { label: "Répétitions",  value: rehearsalsTotal,  icon: Calendar, href: "/repetitions",  color: "#F59E0B" },
            { label: "Feuilles",     value: sheetsTotal,      icon: BookOpen, href: "/messe",        color: "#1D9E75" },
          ].map(({ label, value, icon: Icon, href, color }) => (
            <Link key={label} href={href}
              className="card flex flex-col gap-2 hover:border-opacity-40 transition-all active:scale-[0.97]"
              style={{ padding: "1rem" }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-2xl font-black text-white leading-none">{value}</p>
              <p className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {choirId && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Actions rapides</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: "/chants/nouveau",     emoji: "🎵", label: "Ajouter un chant" },
              { href: "/messe/nouveau",       emoji: "📋", label: "Nouvelle messe" },
              { href: "/repetitions/nouveau", emoji: "📅", label: "Répétition" },
            ].map(({ href, emoji, label }) => (
              <Link key={href} href={href}
                className="card flex flex-col items-center gap-2.5 text-center hover:border-opacity-30 transition-all active:scale-[0.97]"
                style={{ padding: "1.125rem 0.75rem" }}>
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs font-bold text-white leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Featured — recent songs horizontal scroll */}
      {songs.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Chants récents</h2>
            <Link href="/chants" className="section-link">Voir tout →</Link>
          </div>
          <div className="h-scroll">
            {songs.slice(0, 4).map((song: any) => {
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)";
              return (
                <Link key={song.id} href={`/chants/${song.id}`}
                  className="flex-shrink-0 w-36 group">
                  <div className="cover-art w-36 h-36 mb-3 relative"
                    style={{ background: grad }}>
                    <div className="absolute inset-0 flex items-end justify-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute top-2 left-2 text-xl font-black text-white/80">
                      {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <p className="font-bold text-sm text-white truncate">{song.title}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>
                    {song.composer || song.liturgical_type || "—"}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Song list */}
      {songs.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Répertoire</h2>
            <Link href="/chants" className="section-link">Voir tout →</Link>
          </div>
          <div className="card" style={{ padding: "0.5rem" }}>
            {songs.map((song: any, i: number) => {
              const grad = GRAD[song.liturgical_type ?? ""] ?? "linear-gradient(135deg,#7F77DD,#1D9E75)";
              return (
                <div key={song.id}>
                  <Link href={`/chants/${song.id}`} className="song-row">
                    <div className="cover-art flex-shrink-0 font-black text-white/80"
                      style={{ background: grad, width: 44, height: 44, fontSize: "0.65rem" }}>
                      {(song.liturgical_type ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-white truncate">{song.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-2)" }}>
                        {[song.composer, song.key_signature].filter(Boolean).join(" · ") || song.liturgical_type || "—"}
                      </p>
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
        </div>
      )}

      {/* Next rehearsal */}
      {rehearsals.length > 0 && (
        <div>
          <div className="section-header">
            <h2 className="section-title">Répétitions</h2>
            <Link href="/repetitions" className="section-link">Voir tout →</Link>
          </div>
          <div className="space-y-2.5">
            {rehearsals.map((r: any) => (
              <Link key={r.id} href={`/repetitions/${r.id}`}
                className="card flex items-center gap-4 hover:border-opacity-30 transition-all active:scale-[0.99]"
                style={{ padding: "0.875rem 1rem" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(245,158,11,0.15)" }}>
                  <Calendar className="w-5 h-5" style={{ color: "#F59E0B" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white">
                    {new Date(r.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
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
    </div>
  );
}
