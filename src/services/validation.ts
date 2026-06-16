import { createClient } from "@/lib/supabase/server";

/** Soumettre un chant à la validation (choriste → chef) */
export async function submitForValidation(songId: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .update({ validation_status: "en_attente" })
    .eq("id", songId)
    .select("id")
    .single();
}

/** Valider un chant (chef de chœur uniquement) */
export async function validateSong(songId: string, validatedBy: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .update({
      validation_status: "validé",
      validated_by:      validatedBy,
      validated_at:      new Date().toISOString(),
      rejection_note:    null,
    })
    .eq("id", songId)
    .select("id")
    .single();
}

/** Rejeter un chant avec une note (chef de chœur uniquement) */
export async function rejectSong(songId: string, validatedBy: string, note: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .update({
      validation_status: "rejeté",
      validated_by:      validatedBy,
      validated_at:      new Date().toISOString(),
      rejection_note:    note,
    })
    .eq("id", songId)
    .select("id")
    .single();
}

/** Lister les chants en attente de validation pour un chef */
export async function listPendingSongs(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .select("id, title, composer, liturgical_type, created_at, validation_status, rejection_note")
    .eq("choir_id", choirId)
    .in("validation_status", ["en_attente", "rejeté"])
    .order("created_at", { ascending: false });
}

/** Repasser un chant en brouillon (pour le modifier après rejet) */
export async function resetToDraft(songId: string) {
  const supabase = await createClient();
  return supabase
    .from("songs")
    .update({ validation_status: "brouillon", rejection_note: null })
    .eq("id", songId)
    .select("id")
    .single();
}
