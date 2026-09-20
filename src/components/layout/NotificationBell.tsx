"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  getMyNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/actions/notifications";
import type { Notification } from "@/types";

const POLL_MS = 60_000;

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const result = await getMyNotificationsAction();
    if ("error" in result) return;
    setNotifications(result.notifications);
    setUnreadCount(result.unreadCount);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (next) await refresh();
  }

  async function handleClickNotification(n: Notification) {
    setOpen(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      await markNotificationReadAction(n.id);
    }
    if (n.song_id) router.push(`/chants/${n.song_id}`);
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await markAllNotificationsReadAction();
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-black/6"
        style={{ color: "var(--text-3)" }}
        title="Notifications"
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ background: "var(--red)", minWidth: 14, height: 14, padding: "0 3px" }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 z-40 rounded-xl overflow-hidden"
          style={{
            width: 320,
            maxWidth: "calc(100vw - 2rem)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          }}
        >
          <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-sm font-semibold" style={{ color: "var(--text-1)" }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium"
                style={{ color: "var(--gold)" }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-sm text-center" style={{ color: "var(--text-3)" }}>
                Aucune notification
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClickNotification(n)}
                  className="w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors hover:bg-black/3"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span
                    className="mt-1.5 rounded-full flex-shrink-0"
                    style={{
                      width: 6,
                      height: 6,
                      background: n.read ? "transparent" : "var(--gold)",
                    }}
                  />
                  <span className="flex-1 min-w-0">
                    <span
                      className="block text-sm"
                      style={{ color: "var(--text-1)", fontWeight: n.read ? 400 : 600 }}
                    >
                      {n.message}
                    </span>
                    <span className="block text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
