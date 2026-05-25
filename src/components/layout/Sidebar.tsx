"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Music, BookOpen, Calendar, LogOut, Sparkles, Settings } from "lucide-react";
import CantorIcon from "@/components/CantorIcon";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/",           label: "Tableau de bord",  icon: Home },
  { href: "/chants",     label: "Bibliotheque",     icon: Music },
  { href: "/messe",      label: "Feuille de messe", icon: BookOpen },
  { href: "/repetitions",label: "Repetitions",      icon: Calendar },
  { href: "/parametres", label: "Parametres",       icon: Settings },
];

const NAV_LABELS: Record<string, string> = {
  "/":            "Tableau de bord",
  "/chants":      "Bibliothèque",
  "/messe":       "Feuille de messe",
  "/repetitions": "Répétitions",
  "/parametres":  "Paramètres",
};

export default function Sidebar({ userName }: { userName?: string }) {
  const path   = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "var(--bg-2)", borderRight: "1px solid var(--border)" }}>

      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <Link href="/" className="inline-block">
          <CantorIcon size={38} showText />
        </Link>
        <p className="text-xs mt-1.5 ml-0.5" style={{ color: "var(--text-3)" }}>
          Chorale liturgique
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          const label  = NAV_LABELS[href] ?? href;
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "var(--gold-dim)" : "transparent",
                color:      active ? "var(--gold)"     : "var(--text-2)",
              }}>
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* AI shortcut */}
      <div className="px-3 pb-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(127,119,221,0.1)", border: "1px solid rgba(127,119,221,0.2)" }}>
          <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: "var(--violet)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--violet)" }}>Assistant IA</span>
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: "var(--violet-dim)", color: "var(--violet)" }}>
            Beta
          </span>
        </div>
      </div>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, var(--gold), #7F77DD)", color: "#0B1B2B" }}>
              {(userName ?? "C").slice(0, 1).toUpperCase()}
            </div>
            <p className="text-sm font-semibold text-white truncate">{userName ?? "Chef de choeur"}</p>
          </div>
          <button onClick={handleSignOut}
            className="p-1.5 rounded-xl transition-colors flex-shrink-0"
            style={{ color: "var(--text-3)" }} title="Deconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
