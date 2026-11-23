import Image from "next/image";
import { ArrowRight, CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { DashboardRehearsal } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { formatCountdown, formatLongDay, formatTime } from "./format";
import { CardTitle, MaybeLink, btn, cardShadow } from "./ui";

/** Petit calendrier : JEU. / 26 / NOV. */
function DateBlock({ date }: { date: string }) {
  const d = parseISO(date);
  return (
    <div aria-hidden className="w-[54px] shrink-0 overflow-hidden rounded-xl bg-white text-center text-navy md:w-[62px] md:rounded-[14px]">
      <div className="bg-sun py-0.5 text-[10px] font-extrabold uppercase md:text-[11px]">{format(d, "EEE", { locale: fr })}</div>
      <div className="font-display text-xl font-extrabold leading-tight md:pt-1 md:text-2xl">{format(d, "d")}</div>
      <div className="pb-1 text-[9px] font-bold uppercase text-ink-muted md:text-[10px]">{format(d, "MMM", { locale: fr })}</div>
    </div>
  );
}

export default function RehearsalCard({ data }: { data: DashboardRehearsal | null }) {
  return (
    <section
      aria-labelledby="rep-title"
      className={cn("flex h-full flex-col overflow-hidden rounded-[18px] bg-navy text-white", cardShadow)}
    >
      {/* Photo : prend la hauteur libre quand la carte s'allonge à côté du catalogue */}
      <div className="relative min-h-[110px] flex-1 md:min-h-[170px]">
        <Image
          src="/images/dashboard/partition-pupitre.png"
          alt="Partition ouverte sur un pupitre"
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-navy/0 from-35% to-navy" />
      </div>

      <div className="flex flex-col gap-3 px-4 pb-4 pt-1 md:gap-3.5 md:px-[22px] md:pb-[22px]">
        <CardTitle
          id="rep-title"
          icon={CalendarDays}
          title="Prochaine répétition"
          iconClassName="bg-sun/15 text-sun"
        />

        {data ? (
          <>
            <div className="flex items-center gap-3.5">
              <DateBlock date={data.date} />
              <div className="min-w-0">
                <p className="font-display text-lg font-extrabold leading-tight md:text-xl">{formatLongDay(data.date)}</p>
                <p className="mt-0.5 text-[13px] font-bold text-sun">{formatCountdown(data.date)}</p>
              </div>
            </div>

            <dl className="text-sm">
              {data.startTime && (
                <div className="flex justify-between gap-4 border-t border-white/15 py-2.5 md:py-3">
                  <dt className="text-white/70">Heure</dt>
                  <dd className="font-bold">{formatTime(data.startTime)}</dd>
                </div>
              )}
              {data.location && (
                <div className="flex justify-between gap-4 border-t border-white/15 py-2.5 md:py-3">
                  <dt className="text-white/70">Lieu</dt>
                  <dd className="truncate text-right font-bold">{data.location}</dd>
                </div>
              )}
            </dl>

            <MaybeLink href={data.href} className={cn(btn.accent, "self-start")}>
              Voir la répétition <ArrowRight className="h-4 w-4" aria-hidden />
            </MaybeLink>
          </>
        ) : (
          <p className="text-sm font-medium text-white/75">Aucune répétition planifiée pour le moment.</p>
        )}
      </div>
    </section>
  );
}
