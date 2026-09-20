import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/services/notifications";

/** Soumettre un chant à la validation (choriste → chef) */
export async function submitForValidation(songId: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("songs")
    .update({ validation_status: "en_attente" })
    .eq("id", songId)
    .select("id, title, choir_id")
    .single();

  if (result.data) {
    const { data: chefs } = await supabase
      .from("choir_members")
      .select("user_id")
      .eq("choir_id", result.data.choir_id)
      .eq("role", "chef");

    await Promise.all(
      (chefs ?? []).map((chef) =>
        createNotification({
          choirId: result.data.choir_id,
          userId: chef.user_id,
          songId: result.data.id,
          type: "song_submitted",
          message: `Nouveau chant à valider : ${result.data.title}`,
        })
      )
    );
  }

  return result;
}

/** Valider un chant (chef de chœur uniquement) */
export async function validateSong(songId: string, validatedBy: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("songs")
    .update({
      validation_status: "validé",
      validated_by:      validatedBy,
      validated_at:      new Date().toISOString(),
      rejection_note:    null,
    })
    .eq("id", songId)
    .select("id, title, choir_id, created_by")
    .single();

  if (result.data?.created_by && result.data.created_by !== validatedBy) {
    await createNotification({
      choirId: result.data.choir_id,
      userId: result.data.created_by,
      songId: result.data.id,
      type: "song_validated",
      message: `Ton chant « ${result.data.title} » a été validé ✅`,
    });
  }

  return result;
}

/** Rejeter un chant avec une note (chef de chœur uniquement) */
export async function rejectSong(songId: string, validatedBy: string, note: string) {
  const supabase = await createClient();
  const result = await supabase
    .from("songs")
    .update({
      validation_status: "rejeté",
      validated_by:      validatedBy,
      validated_at:      new Date().toISOString(),
      rejection_note:    note,
    })
    .eq("id", songId)
    .select("id, title, choir_id, created_by")
    .single();

  if (result.data?.created_by && result.data.created_by !== validatedBy) {
    await createNotification({
      choirId: result.data.choir_id,
      userId: result.data.created_by,
      songId: result.data.id,
      type: "song_rejected",
      message: `Ton chant « ${result.data.title} » a été rejeté : ${note}`,
    });
  }

  return result;
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
