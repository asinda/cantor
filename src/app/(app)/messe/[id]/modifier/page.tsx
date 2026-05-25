import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MasseForm from "../../nouveau/MasseForm";

export default async function EditMasseSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: sheet }, { data: membership }, { data: sheetSongs }] = await Promise.all([
    supabase.from("mass_sheets").select("*").eq("id", id).single(),
    supabase.from("choir_members").select("choir_id").eq("user_id", user!.id).limit(1).single(),
    supabase.from("mass_sheet_songs").select("song_id,position").eq("mass_sheet_id", id).order("position"),
  ]);

  if (!sheet) notFound();

  const choirId = (membership as any)?.choir_id ?? sheet.choir_id;

  const { data: songs } = await supabase
    .from("songs")
    .select("id,title,liturgical_type,key_signature")
    .eq("choir_id", choirId)
    .order("liturgical_type")
    .order("title");

  const initial = {
    id: sheet.id,
    title: sheet.title,
    date: sheet.date,
    liturgical_season: sheet.liturgical_season,
    notes: sheet.notes,
    initialOrder: (sheetSongs ?? []).map((s: any) => ({ song_id: s.song_id, position: s.position })),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href={`/messe/${id}`} className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Modifier</h1>
        <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{sheet.title}</p>
      </div>
      <MasseForm choirId={choirId} songs={songs ?? []} initial={initial} />
    </div>
  );
}
