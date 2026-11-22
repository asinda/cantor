import Image from "next/image";
import { ArrowRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import type { DashboardRehearsal } from "@/types/dashboard";
import { formatCountdown, formatLongDay, formatTime } from "./format";
import { DashCard, MaybeLink, btn } from "./ui";

export default function RehearsalCard({ data }: { data: DashboardRehearsal | null }) {
  return (
    <DashCard aria-labelledby="rep-title" className="flex flex-col overflow-hidden">
      <div className="relative h-[140px]">
        <Image
          src="/images/dashboard/partition-pupitre.png"
          alt="Partition ouverte sur un pupitre"
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
        {data && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white">
            {formatCountdown(data.date)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 px-6 pb-6 pt-[22px]">
        <h2 id="rep-title" className="flex items-center gap-2.5 font-display text-[19px] font-bold">
          <Users className="h-[22px] w-[22px]" aria-hidden /> Prochaine répétition
        </h2>

        {data ? (
          <>
            <div className="flex flex-col gap-2.5 text-[15px]">
              <span className="flex items-center gap-3">
                <CalendarDays className="h-[18px] w-[18px] text-ink-muted" aria-hidden /> {formatLongDay(data.date)}
              </span>
              {data.startTime && (
                <span className="flex items-center gap-3">
                  <Clock className="h-[18px] w-[18px] text-ink-muted" aria-hidden />
                  {formatTime(data.startTime)}
                  {data.endTime && ` – ${formatTime(data.endTime)}`}
                </span>
              )}
              {data.location && (
                <span className="flex items-center gap-3">
                  <MapPin className="h-[18px] w-[18px] text-ink-muted" aria-hidden /> {data.location}
                </span>
              )}
            </div>
            {data.note && <p className="text-sm text-ink-muted">{data.note}</p>}
            <MaybeLink href={data.href} className={`${btn.primary} mt-auto self-start`}>
              Voir le détail <ArrowRight className="h-4 w-4" aria-hidden />
            </MaybeLink>
          </>
        ) : (
          <p className="text-sm text-ink-muted">Aucune répétition planifiée pour le moment.</p>
        )}
      </div>
    </DashCard>
  );
}
