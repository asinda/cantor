"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { deleteSong } from "@/services/songs";
import { redirect } from "next/navigation";

type LyricsRow = {
  language: string;
  lyrics: string;
  phonetic?: string | null;
};

type YouTubeRow = {
  url: string;
  video_id: string;
  title: string;
  channel: string;
  thumbnail?: string;
  version_type: string;
  is_primary: boolean;
};

type VoiceGuideRow = {
  voice_part: string;
  starting_note?: string | null;
  entry_seconds?: number | null;
  instructions?: string | null;
};

export type SongPayload = {
  title: string;
  choir_id: string;
  composer?: string | null;
  liturgical_type?: string | null;
  liturgical_season?: string | null;
  key_signature?: string | null;
  tempo_bpm?: number | null;
  difficulty?: string | null;
  status: string;
  notes?: string | null;
  languages: string[];
  lyrics: LyricsRow[];
  youtube_links: YouTubeRow[];
  voice_guides: VoiceGuideRow[];
};

export async function createSongAction(payload: SongPayload): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { lyrics, youtube_links, voice_guides, ...songData } = payload;

  const { data: song, error: songErr } = await supabase
    .from("songs")
    .insert({ ...songData, created_by: user.id })
    .select("id")
    .single();

  if (songErr || !song) return { error: songErr?.message ?? "Erreur création chant" };

  await syncRelated(supabase, song.id, lyrics, youtube_links, voice_guides);

  revalidatePath("/chants");
  return { id: song.id };
}

export async function updateSongAction(
  id: string,
  payload: SongPayload
): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  const { lyrics, youtube_links, voice_guides, ...songData } = payload;

  const { error: songErr } = await supabase.from("songs").update(songData).eq("id", id);
  if (songErr) return { error: songErr.message };

  await syncRelated(supabase, id, lyrics, youtube_links, voice_guides);

  revalidatePath(`/chants/${id}`);
  revalidatePath("/chants");
  return { id };
}

async function syncRelated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  songId: string,
  lyrics: LyricsRow[],
  youtubeLinks: YouTubeRow[],
  voiceGuides: VoiceGuideRow[]
) {
  await supabase.from("song_lyrics").delete().eq("song_id", songId);
  if (lyrics.length > 0) {
    await supabase.from("song_lyrics").insert(
      lyrics.map((l) => ({ ...l, song_id: songId }))
    );
  }

  await supabase.from("youtube_links").delete().eq("song_id", songId);
  if (youtubeLinks.length > 0) {
    await supabase.from("youtube_links").insert(
      youtubeLinks.map((l) => ({ ...l, song_id: songId }))
    );
  }

  await supabase.from("voice_guides").delete().eq("song_id", songId);
  if (voiceGuides.length > 0) {
    await supabase.from("voice_guides").insert(
      voiceGuides.map((g) => ({ ...g, song_id: songId }))
    );
  }
}

/** Sauvegarde uniquement les paroles d'un chant (sans toucher aux autres champs) */
export async function saveLyricsAction(
  songId: string,
  lyrics: { language: string; lyrics: string; phonetic?: string | null }[]
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non autorisé" };

  // Supprimer les anciennes paroles et réinsérer
  await supabase.from("song_lyrics").delete().eq("song_id", songId);
  if (lyrics.length > 0) {
    const { error } = await supabase.from("song_lyrics").insert(
      lyrics.map(l => ({ ...l, song_id: songId }))
    );
    if (error) return { error: error.message };
  }

  // Mettre à jour les langues sur le chant
  const languages = lyrics.map(l => l.language);
  const { error: langErr } = await supabase.from("songs").update({ languages }).eq("id", songId);
  if (langErr) return { error: langErr.message };

  revalidatePath(`/chants/${songId}`);
  return { ok: true };
}

export async function updateSongStatusAction(id: string, status: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("songs").update({ status }).eq("id", id);
  revalidatePath(`/chants/${id}`);
}

export async function deleteSongAction(id: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await deleteSong(id);
  revalidatePath("/chants");
  redirect("/chants");
}
