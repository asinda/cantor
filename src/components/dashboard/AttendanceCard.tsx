import { Check, Lock, UserCheck, X } from "lucide-react";
import type { DashboardAttendance } from "@/types/dashboard";
import { formatShortDay } from "./format";
import { CardHeader, DashCard, MaybeLink, btn } from "./ui";

/** Anneau de taux de présence (vert = présences, rose = absences) */
function AttendanceRing({ rate }: { rate: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  return (
    <svg width="56" height="56" viewBox="0 0 80 80" role="img" aria-label={`Taux de présence : ${rate} %`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#FDE2DF" strokeWidth="10" />
      <circle
        cx="40" cy="40" r={r} fill="none" stroke="#157F3D" strokeWidth="10"
        strokeDasharray={`${(rate / 100) * c} ${c}`} transform="rotate(-90 40 40)"
      />
      <text x="40" y="47" textAnchor="middle" fontWeight="800" fontSize="19" fill="#14233F" className="font-display">
        {rate}%
      </text>
    </svg>
  );
}

/**
 * Lecture seule : les présences sont validées par le chantre lors de l'appel.
 * Le choriste ne peut rien modifier ici.
 */
export default function AttendanceCard({ data }: { data: DashboardAttendance | null }) {
  const present = data?.present ?? 0;
  const total = present + (data?.absent ?? 0);
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <DashCard aria-labelledby="pres-title" className="flex flex-col gap-2.5 px-5 py-[18px]">
      <CardHeader id="pres-title" icon={UserCheck} title="Mes présences" iconClassName="bg-ok-soft text-ok" />

      {!data || total === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Aucun appel enregistré pour l’instant.</p>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <AttendanceRing rate={rate} />
            <div className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-ok" /><strong>{data.present}</strong> présences
              </span>
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#F4A29A]" /><strong>{data.absent}</strong> absences
              </span>
            </div>
          </div>

          <ul aria-label="Derniers appels" className="flex flex-col">
            {data.recent.map((call) => (
              <li key={call.id} className="flex items-center justify-between gap-2 border-t border-line-soft py-2 text-sm">
                <span>
                  <strong className="font-semibold">{formatShortDay(call.date)}</strong>
                  <span className="text-ink-muted"> · {call.kind === "messe" ? "Messe" : "Répétition"}</span>
                </span>
                {call.status === "present" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-ok">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> Présent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ko-soft px-2.5 py-0.5 text-xs font-semibold text-ko">
                    <X className="h-3 w-3" strokeWidth={3} aria-hidden /> Absent
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <Lock className="h-3.5 w-3.5" aria-hidden /> Validées par le chantre à l’appel
        </span>
        {data && <MaybeLink href={data.historyHref} className={btn.link}>Historique</MaybeLink>}
      </div>
    </DashCard>
  );
}
