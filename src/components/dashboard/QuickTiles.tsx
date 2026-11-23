import { ArrowRight, CalendarCheck, Users, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, cardShadow } from "./ui";

type Tile = {
  label: string;
  hint: string;
  icon: LucideIcon;
  iconClassName: string;
};

/**
 * Raccourcis Présences / Contributions / Pupitre.
 * Les pages n'existent pas encore : les tuiles ne mènent nulle part pour l'instant
 * (il suffira de transformer le bouton en <Link> quand elles seront prêtes).
 */
const TILES: Tile[] = [
  { label: "Présences",     hint: "Mes présences",      icon: CalendarCheck, iconClassName: "bg-ok-soft text-ok" },
  { label: "Contributions", hint: "Ma cotisation",      icon: Wallet,        iconClassName: "bg-sun-soft text-sun-ink" },
  { label: "Pupitre",       hint: "Mon équipe de voix", icon: Users,         iconClassName: "bg-amethyst-soft text-amethyst" },
];

export default function QuickTiles() {
  return (
    <nav aria-label="Mes raccourcis" className="grid grid-cols-3 gap-2.5 md:gap-5">
      {TILES.map(({ label, hint, icon: Icon, iconClassName }) => (
        <div
          key={label}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-[14px] border border-line bg-white px-1.5 py-3 text-center text-ink md:gap-2.5 md:rounded-[18px] md:px-3 md:py-6",
            cardShadow,
          )}
        >
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl md:h-14 md:w-14 md:rounded-2xl", iconClassName)}>
            <Icon className="h-5 w-5 md:h-[26px] md:w-[26px]" strokeWidth={2.1} aria-hidden />
          </span>
          <span className="font-display text-[13px] font-extrabold md:text-base">{label}</span>
          <span className="hidden text-xs font-medium text-ink-muted sm:block">{hint}</span>
          <span
            aria-disabled
            title="Bientôt disponible"
            className={cn(
              btn.navy,
              "mt-1 min-h-8 cursor-default gap-1 rounded-[9px] px-2.5 text-[11px] md:mt-1.5 md:min-h-11 md:gap-2 md:rounded-xl md:px-5 md:text-sm",
              "hover:bg-navy",
            )}
          >
            Ouvrir <ArrowRight className="h-3.5 w-3.5 md:h-[17px] md:w-[17px]" aria-hidden />
          </span>
        </div>
      ))}
    </nav>
  );
}
