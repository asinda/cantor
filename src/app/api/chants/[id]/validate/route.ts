import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getChoirByUser } from "@/services/choirs";
import { validateSong } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(auth.userId);
  if (!membership || membership.role !== "chef") {
    return NextResponse.json({ error: "Réservé au chef de chœur" }, { status: 403 });
  }

  const { id } = await params;
  const { data, error } = await validateSong(id, auth.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}
