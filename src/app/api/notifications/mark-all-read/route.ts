import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { markAllNotificationsRead } from "@/services/notifications";

export async function POST() {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await markAllNotificationsRead(auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
