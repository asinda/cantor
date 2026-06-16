import { createClient } from "@/lib/supabase/server";

export async function getSubscription(choirId: string) {
  const supabase = await createClient();
  return supabase
    .from("subscriptions")
    .select("*")
    .eq("choir_id", choirId)
    .single();
}

export async function getPlan(choirId: string): Promise<"free" | "essential" | "pro"> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("choir_id", choirId)
    .single();

  if (!data || data.status === "canceled") return "free";
  return (data.plan as "free" | "essential" | "pro") ?? "free";
}

export async function isFeatureAllowed(
  choirId: string,
  feature: "unlimited_songs" | "multilingue" | "voice_guides" | "api"
): Promise<boolean> {
  const plan = await getPlan(choirId);

  const FEATURES: Record<string, string[]> = {
    free:      [],
    essential: ["unlimited_songs", "multilingue", "voice_guides"],
    pro:       ["unlimited_songs", "multilingue", "voice_guides", "api"],
  };

  return FEATURES[plan]?.includes(feature) ?? false;
}

export async function getSongLimit(choirId: string): Promise<number> {
  const plan = await getPlan(choirId);
  return plan === "free" ? 50 : Infinity;
}
