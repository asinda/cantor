import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SongForm from "./SongForm";

export default async function NewSongPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("choir_members")
    .select("choir_id")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const choirId = (membership as any)?.choir_id;
  if (!choirId) redirect("/onboarding");

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <div className="flex items-center gap-3">
        <Link href="/chants" className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--text-2)" }}>
          <ArrowLeft className="w-4 h-4" /> Chants
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Nouveau chant</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Ajoutez un chant à votre répertoire</p>
      </div>
      <SongForm choirId={choirId} />
    </div>
  );
}
