import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardHref } from "@/types/dashboard";

/** Ombre douce commune aux cartes : elles se détachent du fond `canvas` */
export const cardShadow = "shadow-[0_1px_2px_rgba(20,35,63,0.06),0_8px_20px_-10px_rgba(20,35,63,0.18)]";

/** Carte blanche standard du dashboard */
export function DashCard({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-[18px] border border-line bg-white text-ink", cardShadow, className)}
      {...props}
    />
  );
}

/** Titre de carte : pastille icône + titre + élément à droite (bouton…) */
export function CardTitle({
  id, icon: Icon, title, iconClassName, right, className,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  iconClassName: string;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]", iconClassName)}>
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden />
      </span>
      <h2 id={id} className="min-w-0 flex-1 truncate font-display text-base font-extrabold md:text-lg">{title}</h2>
      {right}
    </div>
  );
}

/**
 * Lien qui sait gérer les pages pas encore développées :
 * si `href` est null, on affiche le contenu sans lien (et sans 404).
 */
export function MaybeLink({
  href, className, children, ...rest
}: { href: DashboardHref; className?: string; children: ReactNode } & Omit<ComponentProps<"a">, "href">) {
  if (!href) {
    return (
      <span className={cn(className, "cursor-default opacity-60")} title="Bientôt disponible">
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

/** Styles de boutons partagés */
export const btn = {
  /** Bouton plein bleu nuit, coins arrondis (pas pilule) */
  navy:
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-navy px-5 text-sm font-bold text-white shadow-[0_4px_12px_-4px_rgba(20,35,63,0.5)] transition-colors hover:bg-navy-2",
  /** Bouton plein jaune (sur fond bleu nuit) */
  accent:
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-sun px-5 text-sm font-bold text-navy transition-colors hover:bg-[#E8B43A]",
  /** Contour blanc (sur fond bleu nuit) */
  outlineLight:
    "inline-flex min-h-11 items-center gap-2 rounded-full border-[1.5px] border-white/70 px-5 text-sm font-bold text-white transition-colors hover:bg-white/10",
  /** Contour bleu nuit (sur fond clair) */
  outlineNavy:
    "inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-navy px-5 text-sm font-extrabold text-navy transition-colors hover:bg-navy/5",
  /** Lien texte */
  link: "inline-flex items-center gap-1.5 text-sm font-extrabold text-navy underline-offset-4 hover:underline",
};
