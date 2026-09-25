import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getChoirByUser } from "@/services/choirs";
import { rejectSong } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(auth.userId);
  if (!membership || membership.role !== "chef") {
    return NextResponse.json({ error: "Réservé au chef de chœur" }, { status: 403 });
  }

  const { note } = await req.json();
  if (typeof note !== "string" || !note.trim()) {
    return NextResponse.json({ error: "Le motif de rejet (note) est requis" }, { status: 400 });
  }

  const { id } = await params;
  const { data, error } = await rejectSong(id, auth.userId, note);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}
