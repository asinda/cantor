import Image from "next/image";
import { BookOpen, CalendarDays, Clock, MapPin } from "lucide-react";
import type { DashboardMass } from "@/types/dashboard";
import { formatLongDay, formatTime } from "./format";
import { MaybeLink, btn } from "./ui";

export default function MassHero({ mass }: { mass: DashboardMass | null }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex min-h-[340px] items-end overflow-hidden rounded-3xl bg-navy text-white md:min-h-[400px] md:items-center"
    >
      <Image
        src="/images/dashboard/hero-chorale.png"
        alt=""
        fill
        preload
        sizes="(min-width: 768px) 75vw, 100vw"
        className="object-cover object-[22%_center] md:object-[70%_center]"
      />
      {/* Voile pour garder le texte lisible : vertical sur mobile, horizontal sur desktop */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/85 to-navy/30 md:hidden" />
      <div
        aria-hidden
        className="absolute inset-0 hidden md:block"
        style={{
          background:
            "linear-gradient(90deg, rgba(20,35,63,0.96) 0%, rgba(20,35,63,0.88) 38%, rgba(20,35,63,0.35) 68%, rgba(20,35,63,0.05) 100%)",
        }}
      />

      <div className="relative flex max-w-[640px] flex-col gap-3 p-6 md:p-12">
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-sun">La prochaine messe</p>

        {mass ? (
          <>
            <h1 id="hero-title" className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-[44px]">
              {formatLongDay(mass.date)}
            </h1>
            <p className="text-[17px] text-[#D5DBE6]">{mass.title}</p>

            <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              {mass.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-[18px] w-[18px] text-sun" aria-hidden /> {mass.location}
                </span>
              )}
              {mass.time && (
                <span className="flex items-center gap-2">
                  <Clock className="h-[18px] w-[18px] text-sun" aria-hidden />
                  {formatTime(mass.time)}
                  {mass.meetingTime && ` · rendez-vous ${formatTime(mass.meetingTime)}`}
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <MaybeLink href={mass.sheetHref} className={`${btn.accent} min-h-12 px-[22px] text-[15px]`}>
                <BookOpen className="h-[18px] w-[18px]" aria-hidden /> Voir la feuille de messe
              </MaybeLink>
              <MaybeLink href={mass.calendarHref} className={btn.outlineLight}>
                <CalendarDays className="h-[18px] w-[18px]" aria-hidden /> Calendrier des messes
              </MaybeLink>
            </div>
          </>
        ) : (
          <>
            <h1 id="hero-title" className="font-display text-3xl font-extrabold md:text-[40px]">
              Aucune messe programmée
            </h1>
            <p className="text-[#D5DBE6]">La prochaine feuille de messe apparaîtra ici dès qu’elle sera publiée.</p>
          </>
        )}
      </div>
    </section>
  );
}
