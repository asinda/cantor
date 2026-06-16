import { createClient } from "@/lib/supabase/server";
import { getChoirByUser } from "@/services/choirs";
import { redirect } from "next/navigation";

export type AuthContext = {
  userId: string;
  userName: string | null;
  choirId: string | null;
  choirName: string | null;
};

/**
 * Resolves the authenticated user + their choir in one call.
 * Redirects to /login if not authenticated.
 * Used by server pages and API routes — never call createClient in pages directly.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const membership = await getChoirByUser(user.id);
  return {
    userId:    user.id,
    userName:  user.user_metadata?.full_name ?? null,
    choirId:   membership?.choir_id ?? null,
    choirName: membership?.choirs?.name ?? null,
  };
}

/**
 * Same as getAuthContext but for API routes — returns 401 instead of redirect.
 */
export async function getAuthContextForApi(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const membership = await getChoirByUser(user.id);
  return {
    userId:    user.id,
    userName:  user.user_metadata?.full_name ?? null,
    choirId:   membership?.choir_id ?? null,
    choirName: membership?.choirs?.name ?? null,
  };
}
