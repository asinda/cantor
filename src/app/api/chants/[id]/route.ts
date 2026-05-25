import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSong, updateSong, deleteSong, getSongLyrics, getSongYoutubeLinks, getVoiceGuides } from "@/services/songs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [{ data: song }, { data: lyrics }, { data: youtube }, { data: voices }] = await Promise.all([
    getSong(id),
    getSongLyrics(id),
    getSongYoutubeLinks(id),
    getVoiceGuides(id),
  ]);

  if (!song) return NextResponse.json({ error: "Chant introuvable" }, { status: 404 });

  return NextResponse.json({ song, lyrics, youtube, voices });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await updateSong(id, body);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { error } = await deleteSong(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
