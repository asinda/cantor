import { NextRequest, NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { listRehearsals, createRehearsal } from "@/services/repetitions";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.choirId) return NextResponse.json({ rehearsals: [] });

  const { data, error } = await listRehearsals(auth.choirId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rehearsals: data });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.choirId) return NextResponse.json({ error: "Aucune chorale" }, { status: 400 });

  const { date, notes, song_ids } = await req.json();

  const { data: rehearsal, error } = await createRehearsal(auth.choirId, { date, notes: notes || null });
  if (error || !rehearsal) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

  if (Array.isArray(song_ids) && song_ids.length > 0) {
    const supabase = await createClient();
    await supabase.from("rehearsal_songs").insert(
      song_ids.map((song_id: string, i: number) => ({
        rehearsal_id: rehearsal.id, song_id, order_index: i + 1,
      }))
    );
  }

  return NextResponse.json({ rehearsal }, { status: 201 });
}
