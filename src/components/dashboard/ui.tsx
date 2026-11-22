import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardHref } from "@/types/dashboard";

/** Carte blanche standard du dashboard */
export function DashCard({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      className={cn("rounded-[20px] border border-line bg-white text-ink", className)}
      {...props}
    />
  );
}

/** En-tête de carte : pastille icône + titre + élément à droite (badge, compteur…) */
export function CardHeader({
  id, icon: Icon, title, iconClassName, right,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  iconClassName: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn("flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl", iconClassName)}>
        <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
      </span>
      <h2 id={id} className="flex-1 font-display text-lg font-bold">{title}</h2>
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
  primary:
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-navy px-5 text-sm font-semibold text-white transition-colors hover:bg-navy-2",
  accent:
    "inline-flex min-h-11 items-center gap-2 rounded-full bg-sun px-5 text-sm font-semibold text-navy transition-colors hover:bg-[#E8B43A]",
  secondary:
    "inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-5 text-sm font-semibold text-ink transition-colors hover:bg-canvas",
  outlineLight:
    "inline-flex min-h-12 items-center gap-2.5 rounded-full border-[1.5px] border-white/70 px-5 text-[15px] font-semibold text-white transition-colors hover:bg-white/10",
  link: "inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline-offset-4 hover:underline",
};
