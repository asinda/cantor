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
  const { lyrics, youtube_links, voice_guides, ...songFields } = body;

  const { data, error } = await updateSong(id, songFields);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (lyrics !== undefined) {
    await supabase.from("song_lyrics").delete().eq("song_id", id);
    if (lyrics.length > 0) {
      await supabase.from("song_lyrics").insert(lyrics.map((l: any) => ({ ...l, song_id: id })));
    }
  }

  if (youtube_links !== undefined) {
    await supabase.from("youtube_links").delete().eq("song_id", id);
    if (youtube_links.length > 0) {
      await supabase.from("youtube_links").insert(youtube_links.map((l: any) => ({ ...l, song_id: id })));
    }
  }

  if (voice_guides !== undefined) {
    await supabase.from("voice_guides").delete().eq("song_id", id);
    if (voice_guides.length > 0) {
      await supabase.from("voice_guides").insert(voice_guides.map((g: any) => ({ ...g, song_id: id })));
    }
  }

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
