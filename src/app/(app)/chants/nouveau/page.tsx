import { getAuthContext } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SongForm from "./SongForm";

export default async function NewSongPage() {
  const { choirId } = await getAuthContext();
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
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>Nouveau chant</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-2)" }}>Ajoutez un chant à votre répertoire</p>
      </div>
      <SongForm choirId={choirId} />
    </div>
  );
}
