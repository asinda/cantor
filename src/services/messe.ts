import { createClient } from "@/lib/supabase/server";

export async function listMassSheets(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("mass_sheets")
    .select("id,title,date,liturgical_season,notes,updated_at")
    .eq("choir_id", choirId)
    .order("date", { ascending: false });
}

export async function getMassSheet(id: string) {
  const supabase = await createClient();
  return supabase.from("mass_sheets").select("*").eq("id", id).single();
}

export async function getMassSheetSongs(massSheetId: string) {
  const supabase = await createClient();
  return supabase
    .from("mass_sheet_songs")
    .select("song_id, position, songs(id,title,liturgical_type,key_signature,languages)")
    .eq("mass_sheet_id", massSheetId)
    .order("position");
}

export async function getMassSheetProgram(massSheetId: string) {
  const supabase = await createClient();
  return supabase
    .from("mass_sheet_songs")
    .select("position, songs(id,title,liturgical_type,key_signature,composer,status, song_lyrics(language,lyrics,phonetic))")
    .eq("mass_sheet_id", massSheetId)
    .order("position");
}

export async function countMassSheets(choirId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("mass_sheets")
    .select("*", { count: "exact", head: true })
    .eq("choir_id", choirId);
  return count ?? 0;
}

export async function getRecentMassSheets(choirId: string, limit = 3) {
  const supabase = await createClient();
  return supabase
    .from("mass_sheets")
    .select("id,title,date")
    .eq("choir_id", choirId)
    .order("created_at", { ascending: false })
    .limit(limit);
}

export async function createMassSheet(choirId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  return supabase
    .from("mass_sheets")
    .insert({ ...data, choir_id: choirId })
    .select("id")
    .single();
}

export async function updateMassSheet(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  return supabase.from("mass_sheets").update(data).eq("id", id).select("id").single();
}

export async function deleteMassSheet(id: string) {
  const supabase = await createClient();
  return supabase.from("mass_sheets").delete().eq("id", id);
}
