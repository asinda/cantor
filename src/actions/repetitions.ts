"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createRehearsal, updateRehearsal, deleteRehearsal } from "@/services/repetitions";
import { redirect } from "next/navigation";

type RehearsalPayload = {
  choir_id: string;
  date: string;
  time?: string | null;
  location?: string | null;
  notes?: string | null;
  song_ids: string[];
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createRehearsalAction(payload: RehearsalPayload): Promise<{ id: string } | { error: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const { song_ids, ...rehearsalData } = payload;

  const { data: rehearsal, error } = await createRehearsal(rehearsalData.choir_id, rehearsalData);
  if (error || !rehearsal) return { error: error?.message ?? "Erreur création répétition" };

  if (song_ids.length > 0) {
    const supabase = await createClient();
    await supabase.from("rehearsal_songs").insert(
      song_ids.map((song_id, i) => ({ rehearsal_id: rehearsal.id, song_id, order_index: i + 1 }))
    );
  }

  revalidatePath("/repetitions");
  return { id: rehearsal.id };
}

export async function updateRehearsalAction(id: string, payload: RehearsalPayload): Promise<{ id: string } | { error: string }> {
  const { user, supabase } = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const { song_ids, ...rehearsalData } = payload;

  const { error } = await updateRehearsal(id, rehearsalData);
  if (error) return { error: error.message };

  await supabase.from("rehearsal_songs").delete().eq("rehearsal_id", id);
  if (song_ids.length > 0) {
    await supabase.from("rehearsal_songs").insert(
      song_ids.map((song_id, i) => ({ rehearsal_id: id, song_id, order_index: i + 1 }))
    );
  }

  revalidatePath(`/repetitions/${id}`);
  revalidatePath("/repetitions");
  return { id };
}

export async function deleteRehearsalAction(id: string): Promise<void> {
  const { user } = await requireUser();
  if (!user) return;

  await deleteRehearsal(id);
  revalidatePath("/repetitions");
  redirect("/repetitions");
}
