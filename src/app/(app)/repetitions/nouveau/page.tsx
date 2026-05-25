import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RehearsalForm from "./RehearsalForm";

export default async function NewRehearsalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("choir_members").select("choir_id").eq("user_id", user!.id).limit(1).single();

  const choirId = (membership as any)?.choir_id;
  if (!choirId) redirect("/onboarding");

  const { data: songs } = await supabase
    .from("songs")
    .select("id,title,liturgical_type,status")
    .eq("choir_id", choirId)
    .order("title");

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href="/repetitions" className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Répétitions
      </Link>
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Planifier une répétition</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Organisez votre prochaine session</p>
      </div>
      <RehearsalForm choirId={choirId} songs={songs ?? []} />
    </div>
  );
}
