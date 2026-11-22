import { Clock, Heart } from "lucide-react";
import type { DashboardContribution } from "@/types/dashboard";
import { formatDayMonth } from "./format";
import { CardHeader, DashCard, MaybeLink, btn } from "./ui";

export default function ContributionCard({ data }: { data: DashboardContribution | null }) {
  if (!data) {
    return (
      <DashCard aria-labelledby="contrib-title" className="flex flex-col gap-2.5 px-5 py-[18px]">
        <CardHeader id="contrib-title" icon={Heart} title="Ma contribution" iconClassName="bg-sun-soft text-sun-ink" />
        <p className="py-4 text-sm text-ink-muted">Aucune cotisation en cours.</p>
      </DashCard>
    );
  }

  const percent = data.due > 0 ? Math.min(100, Math.round((data.paid / data.due) * 100)) : 100;
  const remaining = Math.max(0, data.due - data.paid);

  return (
    <DashCard aria-labelledby="contrib-title" className="flex flex-col gap-2.5 px-5 py-[18px]">
      <CardHeader
        id="contrib-title"
        icon={Heart}
        title="Ma contribution"
        iconClassName="bg-sun-soft text-sun-ink"
        right={<span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-muted">{data.season}</span>}
      />

      <div className="flex items-baseline gap-2">
        <span className="font-display text-[26px] font-extrabold">{data.paid} {data.currency}</span>
        <span className="text-sm text-ink-muted">sur {data.due} {data.currency} de cotisation</span>
      </div>

      <div
        role="progressbar"
        aria-label="Cotisation réglée"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2.5 overflow-hidden rounded-full bg-line-soft"
      >
        <div className="h-full rounded-full bg-sun" style={{ width: `${percent}%` }} />
      </div>

      {remaining > 0 ? (
        <p className="flex items-center gap-2 text-sm text-warn-ink">
          <Clock className="h-4 w-4" aria-hidden />
          Reste {remaining} {data.currency}
          {data.deadline && ` avant le ${formatDayMonth(data.deadline)}`}
        </p>
      ) : (
        <p className="text-sm font-semibold text-ok">Cotisation réglée, merci !</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3.5">
        {remaining > 0 && <MaybeLink href={data.payHref} className={btn.accent}>Régler le solde</MaybeLink>}
        <MaybeLink href={data.detailsHref} className={btn.link}>Mes engagements</MaybeLink>
      </div>
    </DashCard>
  );
}
