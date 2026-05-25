import { createClient } from "@/lib/supabase/server";

export async function getChoirByUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("choir_members")
    .select("choir_id, role, voice, choirs(id, name, description, invite_code, created_at, owner_id)")
    .eq("user_id", userId)
    .limit(1)
    .single();
  return data as any;
}

export async function getChoirMembers(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("choir_members")
    .select("id, role, voice, joined_at, user_id")
    .eq("choir_id", choirId)
    .order("joined_at");
}

export async function updateChoir(choirId: string, data: { name?: string; description?: string }) {
  const supabase = await createClient();
  return supabase.from("choirs").update(data).eq("id", choirId).select("id").single();
}

export async function regenerateInviteCode(choirId: string) {
  const supabase = await createClient();
  const newCode = Math.random().toString(36).slice(2, 10).toUpperCase();
  return supabase.from("choirs").update({ invite_code: newCode }).eq("id", choirId).select("invite_code").single();
}

export async function removeMember(choirId: string, userId: string) {
  const supabase = await createClient();
  return supabase.from("choir_members").delete().eq("choir_id", choirId).eq("user_id", userId);
}

export async function updateMemberRole(choirId: string, userId: string, role: string) {
  const supabase = await createClient();
  return supabase.from("choir_members").update({ role }).eq("choir_id", choirId).eq("user_id", userId);
}
