import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { DashboardChoirLife } from "@/types/dashboard";
import { formatDayMonth } from "./format";
import { DashCard, MaybeLink, btn } from "./ui";

export default function ChoirLifeBanner({ data }: { data: DashboardChoirLife }) {
  const [main, ...others] = data.photos;

  return (
    <DashCard aria-labelledby="vie-title" className="grid overflow-hidden rounded-3xl md:grid-cols-2">
      {/* Mosaïque : 1 grande photo + 2 petites */}
      <div className="grid min-h-[260px] grid-cols-3 grid-rows-2 gap-1.5 p-1.5 md:min-h-[340px]">
        {main && (
          <figure className="relative col-span-2 row-span-2 m-0 overflow-hidden rounded-[18px]">
            <Image src={main.src} alt={main.alt} fill sizes="(min-width: 768px) 33vw, 66vw" className="object-cover" />
            <figcaption className="absolute bottom-2.5 left-2.5 rounded-full bg-navy/80 px-2.5 py-1 text-xs font-semibold text-white">
              {main.caption}
            </figcaption>
          </figure>
        )}
        {others.slice(0, 2).map((p) => (
          <figure key={p.src} className="relative m-0 overflow-hidden rounded-[14px]">
            <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 16vw, 33vw" className="object-cover" />
            <figcaption className="absolute bottom-2 left-2 rounded-full bg-navy/80 px-2 py-0.5 text-[11px] font-semibold text-white">
              {p.caption}
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="flex flex-col justify-center gap-3.5 p-6 md:p-10">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-sun-ink">Vie chorale</p>
        <h2 id="vie-title" className="font-display text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
          {data.title}
        </h2>
        <p className="text-[15px] leading-relaxed text-ink-muted">{data.description}</p>
        {data.upcoming.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Prochains rendez-vous">
            {data.upcoming.map((e) => (
              <li key={e.label} className="rounded-full bg-canvas px-3 py-1.5 text-[13px]">
                {e.label} · {formatDayMonth(e.date)}
              </li>
            ))}
          </ul>
        )}
        <MaybeLink href={data.href} className={`${btn.primary} mt-1.5 min-h-12 self-start px-6 text-[15px]`}>
          Découvrir <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
        </MaybeLink>
      </div>
    </DashCard>
  );
}
