import { createClient } from "@/lib/supabase/server";

export async function listSongs(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .select("id,title,liturgical_type,liturgical_season,status,difficulty,languages,key_signature,tempo_bpm,composer,updated_at")
    .eq("choir_id", choirId)
    .order("updated_at", { ascending: false });
}

export async function listSongsFiltered(
  choirId: string,
  filters: { q?: string; type?: string; diff?: string; status?: string; validation_status?: string }
) {
  const supabase = await createClient();
  let query = supabase
    .from("songs")
    .select("id,title,liturgical_type,status,difficulty,key_signature,composer,languages,tempo_bpm,validation_status")
    .eq("choir_id", choirId)
    .order("title");

  if (filters.q)                query = query.ilike("title", `%${filters.q}%`);
  if (filters.type)              query = query.eq("liturgical_type", filters.type);
  if (filters.diff)               query = query.eq("difficulty", filters.diff);
  if (filters.status)             query = query.eq("status", filters.status);
  if (filters.validation_status)  query = query.eq("validation_status", filters.validation_status);

  return query;
}

export async function getRecentSongs(choirId: string, limit = 6) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .select("id,title,liturgical_type,status,key_signature,composer")
    .eq("choir_id", choirId)
    .order("updated_at", { ascending: false })
    .limit(limit);
}

export async function listSongsForProgramme(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .select("id,title,liturgical_type,key_signature,status")
    .eq("choir_id", choirId)
    .order("liturgical_type")
    .order("title");
}

export async function countSongs(choirId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("songs")
    .select("*", { count: "exact", head: true })
    .eq("choir_id", choirId);
  return count ?? 0;
}

export async function getSong(id: string) {
  const supabase = await createClient();
  return supabase.from("songs").select("*").eq("id", id).single();
}

export async function createSong(choirId: string, userId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .insert({ ...data, choir_id: choirId, created_by: userId })
    .select("id")
    .single();
}

export async function updateSong(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  return supabase.from("songs").update(data).eq("id", id).select("id").single();
}

export async function deleteSong(id: string) {
  const supabase = await createClient();
  return supabase.from("songs").delete().eq("id", id);
}

export async function getSongLyrics(songId: string) {
  const supabase = await createClient();
  return supabase.from("song_lyrics").select("*").eq("song_id", songId).order("language");
}

export async function getSongYoutubeLinks(songId: string) {
  const supabase = await createClient();
  return supabase.from("youtube_links").select("*").eq("song_id", songId);
}

export async function getVoiceGuides(songId: string) {
  const supabase = await createClient();
  return supabase.from("voice_guides").select("*").eq("song_id", songId).order("voice_part");
}

export type LyricsInput = { language: string; lyrics: string; phonetic?: string | null };
export type YoutubeLinkInput = {
  url: string; video_id: string; title: string; channel: string;
  thumbnail?: string; version_type: string; is_primary: boolean;
};
export type VoiceGuideInput = {
  voice_part: string; starting_note?: string | null;
  entry_seconds?: number | null; instructions?: string | null;
};

export async function syncSongRelated(
  songId: string,
  lyrics: LyricsInput[],
  youtubeLinks: YoutubeLinkInput[],
  voiceGuides: VoiceGuideInput[]
) {
  const supabase = await createClient();

  await supabase.from("song_lyrics").delete().eq("song_id", songId);
  if (lyrics.length > 0) {
    await supabase.from("song_lyrics").insert(lyrics.map((l) => ({ ...l, song_id: songId })));
  }

  await supabase.from("youtube_links").delete().eq("song_id", songId);
  if (youtubeLinks.length > 0) {
    await supabase.from("youtube_links").insert(youtubeLinks.map((l) => ({ ...l, song_id: songId })));
  }

  await supabase.from("voice_guides").delete().eq("song_id", songId);
  if (voiceGuides.length > 0) {
    await supabase.from("voice_guides").insert(voiceGuides.map((g) => ({ ...g, song_id: songId })));
  }
}

export type FullSongPayload = {
  title: string;
  composer?: string | null;
  liturgical_type?: string | null;
  liturgical_season?: string | null;
  key_signature?: string | null;
  tempo_bpm?: number | null;
  difficulty?: string | null;
  status: string;
  notes?: string | null;
  languages: string[];
  lyrics: LyricsInput[];
  youtube_links: YoutubeLinkInput[];
  voice_guides: VoiceGuideInput[];
};

export async function createFullSong(choirId: string, userId: string, payload: FullSongPayload) {
  const { lyrics, youtube_links, voice_guides, ...songData } = payload;

  const result = await createSong(choirId, userId, songData);
  if (result.error || !result.data) return result;

  await syncSongRelated(result.data.id, lyrics, youtube_links, voice_guides);
  return result;
}
