import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { markNotificationRead } from "@/services/notifications";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.read !== true) {
    return NextResponse.json({ error: "Seul { read: true } est supporté" }, { status: 400 });
  }

  const { id } = await params;
  const { error } = await markNotificationRead(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
