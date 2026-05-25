"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Music, BookOpen, Calendar, Settings } from "lucide-react";

const NAV = [
  { href: "/",            label: "Accueil", icon: Home },
  { href: "/chants",      label: "Chants",  icon: Music },
  { href: "/messe",       label: "Messe",   icon: BookOpen },
  { href: "/repetitions", label: "Repet.",  icon: Calendar },
  { href: "/parametres",  label: "Config",  icon: Settings },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        background: "rgba(11,27,43,0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(201,162,39,0.15)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}>
      <div className="flex">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center pt-3 pb-4 gap-1">
              <div className="relative">
                <Icon
                  className="w-5 h-5 transition-all"
                  style={{ color: active ? "var(--gold)" : "var(--text-3)" }}
                  strokeWidth={active ? 2.5 : 1.75}
                />
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--gold)" }} />
                )}
              </div>
              <span className="text-xs font-semibold transition-colors"
                style={{ color: active ? "var(--gold)" : "var(--text-3)" }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
