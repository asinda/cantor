import { ArrowRight, Megaphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnnouncementTag, DashboardData } from "@/types/dashboard";
import { formatAgo } from "./format";
import { CardHeader, DashCard, MaybeLink, btn } from "./ui";

const TAGS: Record<AnnouncementTag, { label: string; className: string; dot: string }> = {
  important: { label: "Important", className: "bg-ko-soft text-ko", dot: "bg-[#D92D20]" },
  nouveau:   { label: "Nouveau",   className: "bg-info-soft text-info", dot: "bg-info" },
  rappel:    { label: "Rappel",    className: "bg-canvas text-ink-muted", dot: "bg-ink-muted" },
};

export default function AnnouncementsCard({ data }: { data: DashboardData["announcements"] }) {
  const unread = data.items.filter((a) => a.unread).length;

  return (
    <DashCard aria-labelledby="ann-title" className="flex flex-col gap-2.5 px-5 py-[18px]">
      <CardHeader
        id="ann-title"
        icon={Megaphone}
        title="Annonces"
        iconClassName="bg-sun-soft text-warn-ink"
        right={
          unread > 0 && (
            <span className="rounded-full bg-ko-soft px-2.5 py-1 text-xs font-bold text-ko">
              {unread} nouvelle{unread > 1 ? "s" : ""}
            </span>
          )
        }
      />

      {data.items.length === 0 ? (
        <p className="py-4 text-sm text-ink-muted">Aucune annonce pour le moment.</p>
      ) : (
        <ul className="flex flex-col">
          {data.items.map((a) => {
            const tag = TAGS[a.tag];
            return (
              <li key={a.id} className="border-t border-line-soft">
                <MaybeLink href={a.href} className="flex gap-2.5 py-2.5 text-ink !opacity-100">
                  <span
                    aria-hidden
                    className={cn("mt-[7px] h-2 w-2 shrink-0 rounded-full", a.unread ? tag.dot : "bg-transparent")}
                  />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide", tag.className)}>
                        {tag.label}
                      </span>
                      <span className="text-xs text-ink-muted">{formatAgo(a.publishedAt)}</span>
                    </span>
                    <span className="text-sm font-semibold leading-snug">
                      {a.title}
                      {a.unread && <span className="sr-only"> (non lue)</span>}
                    </span>
                  </span>
                </MaybeLink>
              </li>
            );
          })}
        </ul>
      )}

      <MaybeLink href={data.allHref} className={cn(btn.link, "mt-auto")}>
        Toutes les annonces <ArrowRight className="h-4 w-4" aria-hidden />
      </MaybeLink>
    </DashCard>
  );
}
