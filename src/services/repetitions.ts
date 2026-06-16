import { createClient } from "@/lib/supabase/server";

export async function listRehearsals(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("rehearsals")
    .select("id,date,time,location,notes,updated_at")
    .eq("choir_id", choirId)
    .order("date", { ascending: false });
}

export async function getRehearsal(id: string) {
  const supabase = await createClient();
  return supabase.from("rehearsals").select("*").eq("id", id).single();
}

export async function getRehearsalSongs(rehearsalId: string) {
  const supabase = await createClient();
  return supabase
    .from("rehearsal_songs")
    .select("song_id, order_index, songs(id,title,liturgical_type,status,key_signature)")
    .eq("rehearsal_id", rehearsalId)
    .order("order_index");
}

export async function getRehearsalProgram(rehearsalId: string) {
  const supabase = await createClient();
  return supabase
    .from("rehearsal_songs")
    .select("order_index, songs(id,title,liturgical_type,key_signature,status,composer,difficulty)")
    .eq("rehearsal_id", rehearsalId)
    .order("order_index");
}

export async function countRehearsals(choirId: string) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("rehearsals")
    .select("*", { count: "exact", head: true })
    .eq("choir_id", choirId);
  return count ?? 0;
}

export async function getRecentRehearsals(choirId: string, limit = 3) {
  const supabase = await createClient();
  return supabase
    .from("rehearsals")
    .select("id,date,time,location,notes")
    .eq("choir_id", choirId)
    .order("date", { ascending: false })
    .limit(limit);
}

export async function createRehearsal(choirId: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  return supabase
    .from("rehearsals")
    .insert({ ...data, choir_id: choirId })
    .select("id")
    .single();
}

export async function updateRehearsal(id: string, data: Record<string, unknown>) {
  const supabase = await createClient();
  return supabase.from("rehearsals").update(data).eq("id", id).select("id").single();
}

export async function deleteRehearsal(id: string) {
  const supabase = await createClient();
  return supabase.from("rehearsals").delete().eq("id", id);
}
