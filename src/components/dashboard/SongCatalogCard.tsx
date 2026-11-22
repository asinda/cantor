import { ArrowRight, ChevronRight, Music, Plus, Search } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";
import { DashCard, MaybeLink, btn } from "./ui";

export default function SongCatalogCard({ data }: { data: DashboardData["songs"] }) {
  return (
    <DashCard aria-labelledby="cat-title" className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="cat-title" className="flex items-center gap-2.5 font-display text-[19px] font-bold">
          <Music className="h-[22px] w-[22px]" aria-hidden /> Catalogue de chants
        </h2>
        <MaybeLink
          href={data.proposeHref}
          className="inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-sun-soft px-4 text-sm font-semibold text-sun-ink"
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden /> Je propose
        </MaybeLink>
      </div>

      {/* Recherche : renvoie vers /chants?q=… (déjà géré par la page Chants) */}
      <form action="/chants" method="get" role="search">
        {/* div + aria-label : les styles globaux de `label`/`input` (globals.css) sont neutralisés ici */}
        <div className="flex h-11 items-center gap-2.5 rounded-xl bg-canvas px-3.5 text-ink-muted focus-within:ring-2 focus-within:ring-navy/30">
          <Search className="h-[18px] w-[18px] shrink-0" aria-hidden />
          <input
            type="search"
            name="q"
            aria-label="Rechercher un chant"
            placeholder="Rechercher un chant…"
            className="min-w-0 flex-1 !rounded-none !border-0 !bg-transparent !p-0 text-sm text-ink !shadow-none !outline-none placeholder:!text-ink-muted"
          />
        </div>
      </form>

      {data.items.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Le catalogue est encore vide.</p>
      ) : (
        <ul className="flex flex-col">
          {data.items.map((song) => (
            <li key={song.id}>
              <MaybeLink
                href={song.href}
                className="flex items-center gap-3.5 border-b border-line-soft px-1 py-3 text-ink transition-colors hover:bg-canvas"
              >
                <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#EEF1F6]">
                  <Music className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-[15px] font-semibold">{song.title}</span>
                  <span className="truncate text-[13px] text-ink-muted">
                    {[song.category, song.audience].filter(Boolean).join(" · ") || "—"}
                  </span>
                </span>
                {song.duration && <span className="text-[13px] text-ink-muted">{song.duration}</span>}
                <ChevronRight className="h-[18px] w-[18px] text-ink-muted" aria-hidden />
              </MaybeLink>
            </li>
          ))}
        </ul>
      )}

      <MaybeLink href={data.allHref} className={`${btn.primary} self-start`}>
        Voir tout le catalogue <ArrowRight className="h-4 w-4" aria-hidden />
      </MaybeLink>
    </DashCard>
  );
}
