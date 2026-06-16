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
  filters: { q?: string; type?: string; diff?: string; status?: string }
) {
  const supabase = await createClient();
  let query = supabase
    .from("songs")
    .select("id,title,liturgical_type,status,difficulty,key_signature,composer,languages,tempo_bpm")
    .eq("choir_id", choirId)
    .order("title");

  if (filters.q)      query = query.ilike("title", `%${filters.q}%`);
  if (filters.type)   query = query.eq("liturgical_type", filters.type);
  if (filters.diff)   query = query.eq("difficulty", filters.diff);
  if (filters.status) query = query.eq("status", filters.status);

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
