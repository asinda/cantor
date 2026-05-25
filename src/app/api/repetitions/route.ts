import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChoirByUser } from "@/services/choirs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ rehearsals: [] });

  const { data, error } = await supabase
    .from("rehearsals")
    .select("id,date,notes,created_at")
    .eq("choir_id", choirId)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rehearsals: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ error: "Aucune chorale" }, { status: 400 });

  const { date, notes, song_ids } = await req.json();

  const { data: rehearsal, error } = await supabase
    .from("rehearsals")
    .insert({ choir_id: choirId, date, notes: notes || null })
    .select("id").single();

  if (error || !rehearsal) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

  if (Array.isArray(song_ids) && song_ids.length > 0) {
    await supabase.from("rehearsal_songs").insert(
      song_ids.map((song_id: string, i: number) => ({
        rehearsal_id: rehearsal.id, song_id, order_index: i + 1,
      }))
    );
  }

  return NextResponse.json({ rehearsal }, { status: 201 });
}
