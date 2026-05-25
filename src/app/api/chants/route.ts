import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listSongs, createSong } from "@/services/songs";
import { getChoirByUser } from "@/services/choirs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ songs: [] });

  const { data, error } = await listSongs(choirId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ songs: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ error: "Aucune chorale" }, { status: 400 });

  const body = await req.json();
  const { data, error } = await createSong(choirId, user.id, body);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data }, { status: 201 });
}
