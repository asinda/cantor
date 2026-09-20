"use server";

import { createClient } from "@/lib/supabase/server";
import {
  listNotifications,
  countUnreadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notifications";
import type { Notification } from "@/types";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getMyNotificationsAction(): Promise<
  { notifications: Notification[]; unreadCount: number } | { error: string }
> {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const [{ data: notifications, error: listError }, { count, error: countError }] = await Promise.all([
    listNotifications(user.id),
    countUnreadNotifications(user.id),
  ]);
  if (listError) return { error: listError.message };
  if (countError) return { error: countError.message };

  return { notifications: (notifications ?? []) as Notification[], unreadCount: count ?? 0 };
}

export async function markNotificationReadAction(id: string) {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };
  const { error } = await markNotificationRead(id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };
  const { error } = await markAllNotificationsRead(user.id);
  if (error) return { error: error.message };
  return { ok: true };
}
