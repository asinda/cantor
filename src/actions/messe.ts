"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createMassSheet, updateMassSheet, deleteMassSheet } from "@/services/messe";
import { redirect } from "next/navigation";

type SongOrder = { song_id: string; position: number };

type MassePayload = {
  title: string;
  choir_id: string;
  date?: string | null;
  liturgical_season?: string | null;
  notes?: string | null;
  songs: SongOrder[];
};

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createMasseAction(payload: MassePayload): Promise<{ id: string } | { error: string }> {
  const { user } = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const { songs, ...sheetData } = payload;

  const { data: sheet, error } = await createMassSheet(sheetData.choir_id, sheetData);
  if (error || !sheet) return { error: error?.message ?? "Erreur création feuille" };

  if (songs.length > 0) {
    const supabase = await createClient();
    await supabase.from("mass_sheet_songs").insert(
      songs.map((e) => ({ mass_sheet_id: sheet.id, song_id: e.song_id, position: e.position }))
    );
  }

  revalidatePath("/messe");
  return { id: sheet.id };
}

export async function updateMasseAction(id: string, payload: MassePayload): Promise<{ id: string } | { error: string }> {
  const { user, supabase } = await requireUser();
  if (!user) return { error: "Non autorisé" };

  const { songs, ...sheetData } = payload;

  const { error } = await updateMassSheet(id, sheetData);
  if (error) return { error: error.message };

  await supabase.from("mass_sheet_songs").delete().eq("mass_sheet_id", id);
  if (songs.length > 0) {
    await supabase.from("mass_sheet_songs").insert(
      songs.map((e) => ({ mass_sheet_id: id, song_id: e.song_id, position: e.position }))
    );
  }

  revalidatePath(`/messe/${id}`);
  revalidatePath("/messe");
  return { id };
}

export async function deleteMasseAction(id: string): Promise<void> {
  const { user } = await requireUser();
  if (!user) return;

  await deleteMassSheet(id);
  revalidatePath("/messe");
  redirect("/messe");
}
