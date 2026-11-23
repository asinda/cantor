import { ArrowRight, ChevronRight, Music, Plus, Search } from "lucide-react";
import type { DashboardData, SeasonTone } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { formatAgo } from "./format";
import { CardTitle, DashCard, MaybeLink, btn } from "./ui";

/** Étiquette du temps liturgique dans sa couleur */
const SEASON_PILL: Record<SeasonTone, string> = {
  violet: "bg-amethyst-soft text-amethyst",
  gold: "bg-sun-soft text-sun-ink",
  green: "bg-ok-soft text-ok",
  neutral: "bg-canvas text-ink-muted",
};

const pill = "whitespace-nowrap rounded-full px-2 py-px text-[10px] font-bold md:px-2.5 md:text-[11px]";

export default function SongCatalogCard({ data }: { data: DashboardData["songs"] }) {
  return (
    <DashCard aria-labelledby="cat-title" className="flex flex-col gap-3 p-4 md:gap-4 md:p-[22px]">
      <CardTitle
        id="cat-title"
        icon={Music}
        title="Catalogue de chants"
        iconClassName="bg-info-soft text-info"
        right={
          <MaybeLink href={data.addHref} className={cn(btn.navy, "shrink-0 whitespace-nowrap rounded-full px-4 md:min-h-[46px] md:px-[22px] md:text-[15px]")}>
            <Plus className="h-4 w-4" strokeWidth={2.6} aria-hidden /> Chant
          </MaybeLink>
        }
      />

      {/* Recherche : renvoie vers /chants?q=… (déjà géré par la page Chants) */}
      <form action="/chants" method="get" role="search">
        {/* div + aria-label : les styles globaux de `label`/`input` (globals.css) sont neutralisés ici */}
        <div className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-white px-4 text-ink-muted focus-within:ring-2 focus-within:ring-navy/30">
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
        <p className="py-4 text-sm font-medium text-ink-muted">Le catalogue est encore vide.</p>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between text-[11px] md:text-xs">
            <span className="font-extrabold uppercase tracking-[0.06em] text-ink-muted">
              {data.items.length} derniers ajouts{data.items.length > 3 && " · faites défiler"}
            </span>
            <span className="font-semibold text-ink-muted">Chants validés</span>
          </div>

          {/* Bac : ~3 chants visibles, le reste en défilement intérieur */}
          <ul
            aria-label="Derniers chants ajoutés"
            className="flex max-h-[186px] flex-col gap-1.5 overflow-y-auto overscroll-contain rounded-2xl bg-tray p-1.5 [scrollbar-color:#8C99AD_transparent] [scrollbar-width:thin] md:max-h-[232px] md:gap-[7px] md:p-2"
          >
            {data.items.map((song, i) => (
              <li key={song.id}>
                <MaybeLink
                  href={song.href}
                  className="flex items-center gap-2.5 rounded-xl border border-[#DCE3EE] bg-white px-2.5 py-2 text-ink shadow-[0_1px_2px_rgba(20,35,63,0.06)] transition-colors hover:border-navy/30 md:gap-3.5 md:px-3.5 md:py-2.5"
                >
                  <span className="hidden w-5 shrink-0 text-center font-display text-[13px] font-extrabold text-[#98A2B3] md:block">
                    {i + 1}
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] bg-navy text-sun md:h-[38px] md:w-[38px] md:rounded-[10px]">
                    <Music className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-display text-[13px] font-extrabold md:text-[15px]">{song.title}</span>
                    <span className="flex gap-1.5">
                      {song.category && <span className={cn(pill, "bg-info-soft text-info")}>{song.category}</span>}
                      {song.season && <span className={cn(pill, SEASON_PILL[song.seasonTone])}>{song.season}</span>}
                    </span>
                  </span>
                  <span className="hidden whitespace-nowrap text-xs font-semibold text-ink-muted md:block">
                    {formatAgo(song.addedAt)}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#98A2B3] md:h-[18px] md:w-[18px]" aria-hidden />
                </MaybeLink>
              </li>
            ))}
          </ul>
        </div>
      )}

      <MaybeLink href={data.allHref} className={cn(btn.link, "self-end")}>
        Voir tout le catalogue <ArrowRight className="h-4 w-4" aria-hidden />
      </MaybeLink>
    </DashCard>
  );
}
