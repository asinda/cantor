import { getAuthContext } from "@/lib/auth";
import { getRehearsal, getRehearsalSongs } from "@/services/repetitions";
import { listSongsForProgramme } from "@/services/songs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import RehearsalForm from "../../nouveau/RehearsalForm";

export default async function EditRehearsalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { choirId } = await getAuthContext();

  const [{ data: rehearsal }, { data: rehearsalSongs }] = await Promise.all([
    getRehearsal(id),
    getRehearsalSongs(id),
  ]);

  if (!rehearsal) notFound();

  const resolvedChoirId = choirId ?? rehearsal.choir_id;
  const { data: songs } = await listSongsForProgramme(resolvedChoirId);

  const initial = {
    id:            rehearsal.id,
    date:          rehearsal.date,
    notes:         rehearsal.notes,
    initialPicked: (rehearsalSongs ?? []).map((s: any) => s.song_id),
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href={`/repetitions/${id}`} className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>Modifier</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>
          {new Date(rehearsal.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      <RehearsalForm choirId={resolvedChoirId} songs={songs ?? []} initial={initial} />
    </div>
  );
}
