import { createClient } from "@/lib/supabase/server";
import type { NotificationType } from "@/types";

/** Crée une notification pour un membre du chœur */
export async function createNotification(params: {
  choirId: string;
  userId: string;
  songId?: string | null;
  type: NotificationType;
  message: string;
}) {
  const supabase = await createClient();
  return supabase.from("notifications").insert({
    choir_id: params.choirId,
    user_id: params.userId,
    song_id: params.songId ?? null,
    type: params.type,
    message: params.message,
  });
}

/** Liste les notifications les plus récentes d'un utilisateur */
export async function listNotifications(userId: string, limit = 10) {
  const supabase = await createClient();
  return supabase
    .from("notifications")
    .select("id, song_id, type, message, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

/** Compte les notifications non lues d'un utilisateur */
export async function countUnreadNotifications(userId: string) {
  const supabase = await createClient();
  return supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("read", false);
}

/** Marque une notification comme lue */
export async function markNotificationRead(id: string) {
  const supabase = await createClient();
  return supabase.from("notifications").update({ read: true }).eq("id", id);
}

/** Marque toutes les notifications d'un utilisateur comme lues */
export async function markAllNotificationsRead(userId: string) {
  const supabase = await createClient();
  return supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
}
