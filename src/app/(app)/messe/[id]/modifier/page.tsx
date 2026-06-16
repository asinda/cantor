import { getAuthContext } from "@/lib/auth";
import { getMassSheet, getMassSheetSongs } from "@/services/messe";
import { listSongsForProgramme } from "@/services/songs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MasseForm from "../../nouveau/MasseForm";

export default async function EditMasseSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { choirId } = await getAuthContext();

  const [{ data: sheet }, { data: sheetSongs }] = await Promise.all([
    getMassSheet(id),
    getMassSheetSongs(id),
  ]);

  if (!sheet) notFound();

  const resolvedChoirId = choirId ?? sheet.choir_id;
  const { data: songs } = await listSongsForProgramme(resolvedChoirId);

  const initial = {
    id:                sheet.id,
    title:             sheet.title,
    date:              sheet.date,
    liturgical_season: sheet.liturgical_season,
    notes:             sheet.notes,
    initialOrder:      (sheetSongs ?? []).map((s: any) => ({ song_id: s.song_id, position: s.position })),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href={`/messe/${id}`} className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>Modifier</h1>
        <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{sheet.title}</p>
      </div>
      <MasseForm choirId={resolvedChoirId} songs={songs ?? []} initial={initial} />
    </div>
  );
}
