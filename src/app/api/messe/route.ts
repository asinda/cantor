import { NextRequest, NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { listMassSheets, createMassSheet } from "@/services/messe";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.choirId) return NextResponse.json({ sheets: [] });

  const { data, error } = await listMassSheets(auth.choirId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sheets: data });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!auth.choirId) return NextResponse.json({ error: "Aucune chorale" }, { status: 400 });

  const { title, date, liturgical_season, notes, songs } = await req.json();

  const { data: sheet, error } = await createMassSheet(auth.choirId, {
    title, date: date || null, liturgical_season: liturgical_season || null, notes: notes || null,
  });
  if (error || !sheet) return NextResponse.json({ error: error?.message ?? "Erreur" }, { status: 500 });

  if (Array.isArray(songs) && songs.length > 0) {
    const supabase = await createClient();
    await supabase.from("mass_sheet_songs").insert(
      songs.map((s: { song_id: string; position: number }) => ({
        mass_sheet_id: sheet.id, song_id: s.song_id, position: s.position,
      }))
    );
  }

  return NextResponse.json({ sheet }, { status: 201 });
}
