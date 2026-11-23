import Image from "next/image";
import { ArrowRight, Heart } from "lucide-react";
import type { DashboardChoirLife } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { DashCard, MaybeLink, btn } from "./ui";

export default function ChoirLifeBanner({ data }: { data: DashboardChoirLife }) {
  const [main, ...others] = data.photos;

  return (
    <DashCard aria-labelledby="vie-title" className="grid overflow-hidden md:grid-cols-[1.05fr_1fr] md:rounded-[20px]">
      {/* Mosaïque : 1 grande photo à gauche + 2 empilées (mobile : 3 en bande) */}
      <div className="grid h-[110px] grid-cols-[1.4fr_1fr_1fr] gap-1 p-1 md:h-[350px] md:grid-cols-[1.4fr_1fr] md:grid-rows-2 md:gap-1.5 md:p-1.5">
        {main && (
          <div className="relative overflow-hidden rounded-[10px] md:row-span-2 md:rounded-[14px]">
            <Image src={main.src} alt={main.alt} fill sizes="(min-width: 768px) 30vw, 40vw" className="object-cover" />
          </div>
        )}
        {others.slice(0, 2).map((p) => (
          <div key={p.src} className="relative overflow-hidden rounded-[10px] md:rounded-[14px]">
            <Image src={p.src} alt={p.alt} fill sizes="(min-width: 768px) 20vw, 30vw" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="flex flex-col justify-center gap-2.5 bg-gradient-to-br from-[#FFFBEF] to-white to-70% p-4 md:gap-3 md:px-10 md:py-8">
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.06em] text-sun-ink md:text-xs">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sun-soft md:h-7 md:w-7">
            <Heart className="h-3.5 w-3.5 md:h-[15px] md:w-[15px]" strokeWidth={2.4} aria-hidden />
          </span>
          Vie chorale
        </p>
        <h2 id="vie-title" className="font-display text-lg font-extrabold leading-tight md:text-[28px]">
          {data.title}
        </h2>
        <p className="hidden text-[15px] font-medium leading-relaxed text-ink-muted md:block">{data.description}</p>
        <ul className="flex flex-wrap gap-1.5 md:gap-2" aria-label="Moments partagés">
          {data.tags.map((t) => (
            <li key={t} className="rounded-full border border-line bg-white px-2.5 py-0.5 text-[11px] font-bold md:px-3 md:py-1 md:text-xs">
              {t}
            </li>
          ))}
        </ul>
        <MaybeLink href={data.href} className={cn(btn.outlineNavy, "mt-1 self-start")}>
          Découvrir <ArrowRight className="h-4 w-4" aria-hidden />
        </MaybeLink>
      </div>
    </DashCard>
  );
}
