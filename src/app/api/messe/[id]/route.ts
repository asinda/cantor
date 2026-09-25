import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { getMassSheet, getMassSheetSongs, updateMassSheet, deleteMassSheet } from "@/services/messe";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const [{ data: sheet }, { data: songs }] = await Promise.all([
    getMassSheet(id),
    getMassSheetSongs(id),
  ]);
  if (!sheet) return NextResponse.json({ error: "Feuille introuvable" }, { status: 404 });

  return NextResponse.json({ sheet, songs: songs ?? [] });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { songs, ...sheetData } = await req.json();

  const { data, error } = await updateMassSheet(id, sheetData);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(songs)) {
    const supabase = await createClient();
    await supabase.from("mass_sheet_songs").delete().eq("mass_sheet_id", id);
    if (songs.length > 0) {
      await supabase.from("mass_sheet_songs").insert(
        songs.map((s: { song_id: string; position: number }) => ({ mass_sheet_id: id, song_id: s.song_id, position: s.position }))
      );
    }
  }

  return NextResponse.json({ sheet: data });
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await deleteMassSheet(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
