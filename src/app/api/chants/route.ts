import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listSongs, listSongsFiltered, createFullSong } from "@/services/songs";
import { getChoirByUser } from "@/services/choirs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  const choirId = membership?.choir_id;
  if (!choirId) return NextResponse.json({ songs: [] });

  const sp = req.nextUrl.searchParams;
  const hasFilters = sp.has("q") || sp.has("type") || sp.has("diff") || sp.has("status") || sp.has("validation_status");

  const { data, error } = hasFilters
    ? await listSongsFiltered(choirId, {
        q: sp.get("q") ?? undefined,
        type: sp.get("type") ?? undefined,
        diff: sp.get("diff") ?? undefined,
        status: sp.get("status") ?? undefined,
        validation_status: sp.get("validation_status") ?? undefined,
      })
    : await listSongs(choirId);
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
  const { data, error } = await createFullSong(choirId, user.id, {
    lyrics: [], youtube_links: [], voice_guides: [],
    ...body,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data }, { status: 201 });
}
