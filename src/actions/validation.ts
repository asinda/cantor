"use server";

import { createClient } from "@/lib/supabase/server";
import { getChoirByUser } from "@/services/choirs";
import { submitForValidation, validateSong, rejectSong, resetToDraft } from "@/services/validation";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function submitSongForValidationAction(songId: string) {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };
  const { error } = await submitForValidation(songId);
  if (error) return { error: error.message };
  revalidatePath(`/chants/${songId}`);
  revalidatePath("/chants");
  return { ok: true };
}

export async function validateSongAction(songId: string) {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const membership = await getChoirByUser(user.id);
  if (!membership || membership.role !== "chef") return { error: "Réservé au chef de chœur" };

  const { error } = await validateSong(songId, user.id);
  if (error) return { error: error.message };
  revalidatePath(`/chants/${songId}`);
  revalidatePath("/chants");
  revalidatePath("/chants/validation");
  return { ok: true };
}

export async function rejectSongAction(songId: string, note: string) {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const membership = await getChoirByUser(user.id);
  if (!membership || membership.role !== "chef") return { error: "Réservé au chef de chœur" };

  const { error } = await rejectSong(songId, user.id, note);
  if (error) return { error: error.message };
  revalidatePath(`/chants/${songId}`);
  revalidatePath("/chants/validation");
  return { ok: true };
}

export async function resetSongToDraftAction(songId: string) {
  const user = await requireUser();
  if (!user) return { error: "Non autorisé" };
  const { error } = await resetToDraft(songId);
  if (error) return { error: error.message };
  revalidatePath(`/chants/${songId}`);
  return { ok: true };
}
