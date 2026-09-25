import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getRehearsal, getRehearsalSongs, updateRehearsal, deleteRehearsal } from "@/services/repetitions";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [{ data: rehearsal }, { data: songs }] = await Promise.all([
    getRehearsal(id),
    getRehearsalSongs(id),
  ]);
  if (!rehearsal) return NextResponse.json({ error: "Répétition introuvable" }, { status: 404 });

  return NextResponse.json({ rehearsal, songs: songs ?? [] });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { song_ids, choir_id, ...rehearsalData } = await req.json();

  const { data, error } = await updateRehearsal(id, rehearsalData);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(song_ids)) {
    const supabase = await createClient();
    await supabase.from("rehearsal_songs").delete().eq("rehearsal_id", id);
    if (song_ids.length > 0) {
      await supabase.from("rehearsal_songs").insert(
        song_ids.map((song_id: string, i: number) => ({ rehearsal_id: id, song_id, order_index: i + 1 }))
      );
    }
  }

  return NextResponse.json({ rehearsal: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await deleteRehearsal(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
