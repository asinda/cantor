import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { listNotifications, countUnreadNotifications } from "@/services/notifications";

export async function GET() {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [{ data: notifications, error: listError }, { count, error: countError }] = await Promise.all([
    listNotifications(auth.userId),
    countUnreadNotifications(auth.userId),
  ]);
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  return NextResponse.json({ notifications: notifications ?? [], unreadCount: count ?? 0 });
}
