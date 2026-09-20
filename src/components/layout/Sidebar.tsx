"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Music, BookOpen, Calendar, Settings, LogOut, PanelLeftClose, PanelLeftOpen, CheckCircle } from "lucide-react";
import CantorIcon from "@/components/CantorIcon";
import { signOutAction } from "@/actions/auth";
import NotificationBell from "@/components/layout/NotificationBell";
import { useState } from "react";

const NAV = [
  { href: "/dashboard",   label: "Accueil",           icon: Home,     color: "#A0621A" },
  { href: "/chants",      label: "Bibliothèque",      icon: Music,    color: "#6B3800" },
  { href: "/chants/validation", label: "Validation",   icon: CheckCircle, color: "#4A7C59" },
  { href: "/messe",       label: "Feuilles de messe", icon: BookOpen, color: "#4A7C59" },
  { href: "/repetitions", label: "Répétitions",       icon: Calendar, color: "#A0621A" },
  { href: "/parametres",  label: "Paramètres",        icon: Settings, color: "#9A7D5A" },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      suppressHydrationWarning
      style={{
        width: collapsed ? 60 : 240,
        transition: "width 0.2s ease",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo + toggle */}
      <div className="flex items-center justify-between px-4 pt-5 pb-6"
        style={{ minHeight: 64 }}>
        {!collapsed && (
          <Link href="/dashboard" className="inline-block">
            <CantorIcon size={28} showText />
          </Link>
        )}
        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
          {!collapsed && <NotificationBell />}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/6 flex-shrink-0"
            style={{ color: "var(--text-3)" }}
            title={collapsed ? "Déplier" : "Réduire"}
          >
            {collapsed
              ? <PanelLeftOpen className="w-4 h-4" />
              : <PanelLeftClose className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, color }) => {
          const active = href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);
          return (
            <Link key={href} href={href}
              title={collapsed ? label : undefined}
              className="flex items-center gap-3 rounded-lg text-sm transition-all"
              style={{
                padding: collapsed ? "0.625rem" : "0.625rem 0.75rem",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? `${color}10` : "transparent",
                color: active ? color : "var(--text-2)",
                fontWeight: active ? 600 : 400,
                borderLeft: active && !collapsed ? `3px solid ${color}` : "3px solid transparent",
              }}>
              <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.75}
                style={{ color: active ? color : "var(--text-3)" }} />
              {!collapsed && label}
            </Link>
          );
        })}
      </nav>

      {/* Séparateur */}
      <div className="mx-3 my-2" style={{ height: 1, background: "var(--border)" }} />

      {/* User */}
      <div className="mx-2 mb-4 px-2 py-2.5 rounded-lg flex items-center gap-2.5"
        style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: "var(--gold)", color: "white" }}>
          {(userName ?? "C").slice(0, 1).toUpperCase()}
        </div>
        {!collapsed && (
          <>
            <p className="text-sm flex-1 truncate" style={{ color: "var(--text-2)" }}>
              {userName ?? "Chef de chœur"}
            </p>
            <button onClick={() => signOutAction()}
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/6 transition-colors"
              style={{ color: "var(--text-3)" }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
