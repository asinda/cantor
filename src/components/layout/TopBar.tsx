"use client";
import Link from "next/link";
import CantorIcon from "@/components/CantorIcon";
import { signOutAction } from "@/actions/auth";
import NotificationBell from "@/components/layout/NotificationBell";
import { LogOut } from "lucide-react";

interface Props {
  userName?: string | null;
  choirName?: string | null;
}

export default function TopBar({ userName, choirName }: Props) {
  return (
    <header
      className="md:hidden flex items-center justify-between px-4 py-3 sticky top-0 z-30"
      style={{
        background: "rgba(250,249,248,0.97)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <Link href="/dashboard" className="flex items-center">
        <CantorIcon size={26} showText />
      </Link>

      <div className="flex items-center gap-2.5">
        {choirName && (
          <span className="text-xs font-medium hidden sm:block"
            style={{ color: "var(--text-2)" }}>
            {choirName}
          </span>
        )}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--gold)", color: "white" }}>
          {(userName ?? "C").slice(0, 1).toUpperCase()}
        </div>
        <NotificationBell />
        <button
          onClick={() => signOutAction()}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: "var(--text-3)" }}
          title="Déconnexion"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
