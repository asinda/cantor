"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Music, BookOpen, Calendar, Settings } from "lucide-react";

const NAV = [
  { href: "/dashboard",   label: "Accueil",  icon: Home,     color: "#A0621A" },
  { href: "/chants",      label: "Chants",   icon: Music,    color: "#6B3800" },
  { href: "/messe",       label: "Messe",    icon: BookOpen, color: "#4A7C59" },
  { href: "/repetitions", label: "Répét.",   icon: Calendar, color: "#A0621A" },
  { href: "/parametres",  label: "Config.",  icon: Settings, color: "#9A7D5A" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex" style={{ height: "3.75rem" }}>
        {NAV.map(({ href, label, icon: Icon, color }) => {
          const active = href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-opacity active:opacity-60"
              style={{ position: "relative" }}>
              {active && (
                <span style={{
                  position: "absolute", top: 0, left: "25%", right: "25%",
                  height: "2px", borderRadius: "0 0 2px 2px",
                  background: color,
                }} />
              )}
              <Icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.75}
                style={{ color: active ? color : "var(--text-3)" }}
              />
              <span style={{
                fontSize: "0.575rem",
                fontWeight: active ? 600 : 400,
                color: active ? color : "var(--text-3)",
                letterSpacing: "0.01em",
              }}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
