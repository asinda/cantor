"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Music, BookOpen, Calendar, LogOut } from "lucide-react";
import CantorIcon from "@/components/CantorIcon";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/",            label: "Tableau de bord", icon: Home },
  { href: "/chants",      label: "Chants",           icon: Music },
  { href: "/messe",       label: "Feuille de messe", icon: BookOpen },
  { href: "/repetitions", label: "Répétitions",      icon: Calendar },
];

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
      <div className="px-5 pt-7 pb-5">
        <div className="flex items-center gap-3">
          <CantorIcon size={38} showText />
          <p className="text-xs ml-1" style={{ color: "var(--text-3)" }}>Chorale liturgique</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? "var(--violet-dim)" : "transparent",
                color: active ? "#7F77DD" : "var(--text-2)",
              }}>
              <Icon
                className="w-4 h-4 flex-shrink-0 transition-colors"
                strokeWidth={active ? 2.5 : 1.75}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-black flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7F77DD, #1D9E75)" }}>
              {(userName ?? "C").slice(0, 1).toUpperCase()}
            </div>
            <p className="text-sm font-semibold text-white truncate">{userName ?? "Chef de chœur"}</p>
          </div>
          <button onClick={handleSignOut}
            className="p-1.5 rounded-xl transition-colors flex-shrink-0"
            style={{ color: "var(--text-3)" }}
            title="Déconnexion">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
