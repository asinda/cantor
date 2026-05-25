import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RehearsalForm from "../../nouveau/RehearsalForm";

export default async function EditRehearsalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: rehearsal }, { data: membership }, { data: rehearsalSongs }] = await Promise.all([
    supabase.from("rehearsals").select("*").eq("id", id).single(),
    supabase.from("choir_members").select("choir_id").eq("user_id", user!.id).limit(1).single(),
    supabase.from("rehearsal_songs").select("song_id").eq("rehearsal_id", id).order("order_index"),
  ]);

  if (!rehearsal) notFound();

  const choirId = (membership as any)?.choir_id ?? rehearsal.choir_id;

  const { data: songs } = await supabase
    .from("songs")
    .select("id,title,liturgical_type,status")
    .eq("choir_id", choirId)
    .order("title");

  const initial = {
    id: rehearsal.id,
    date: rehearsal.date,
    notes: rehearsal.notes,
    initialPicked: (rehearsalSongs ?? []).map((s: any) => s.song_id),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href={`/repetitions/${id}`} className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Modifier</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
          {new Date(rehearsal.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <RehearsalForm choirId={choirId} songs={songs ?? []} initial={initial} />
    </div>
  );
}
