import { getAuthContext } from "@/lib/auth";
import { listSongsForProgramme } from "@/services/songs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MasseForm from "./MasseForm";

export default async function NewMasseSheetPage() {
  const { choirId } = await getAuthContext();
  if (!choirId) redirect("/onboarding");

  const { data: songs } = await listSongsForProgramme(choirId);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href="/messe" className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Feuilles de messe
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>Nouvelle feuille</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Composez votre programme de messe</p>
      </div>
      <MasseForm choirId={choirId} songs={songs ?? []} />
    </div>
  );
}
