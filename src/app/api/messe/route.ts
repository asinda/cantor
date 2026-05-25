import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChoirByUser } from "@/services/choirs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ sheets: [] });

  const { data, error } = await supabase
    .from("mass_sheets")
    .select("id,title,date,liturgical_season,notes,created_at")
    .eq("choir_id", choirId)
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sheets: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ error: "Aucune chorale" }, { status: 400 });

  const { title, date, liturgical_season, notes, songs } = await req.json();

  const { data: sheet, error } = await supabase
    .from("mass_sheets")
    .insert({ choir_id: choirId, title, date: date || null, liturgical_season: liturgical_season || null, notes: notes || null })
    .select("id").single();

  if (error || !sheet) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

  if (Array.isArray(songs) && songs.length > 0) {
    await supabase.from("mass_sheet_songs").insert(
      songs.map((s: { song_id: string; position: number }) => ({
        mass_sheet_id: sheet.id, song_id: s.song_id, position: s.position,
      }))
    );
  }

  return NextResponse.json({ sheet }, { status: 201 });
}
