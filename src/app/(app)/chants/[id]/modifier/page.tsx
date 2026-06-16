import { getAuthContext } from "@/lib/auth";
import { getSong, getSongLyrics, getSongYoutubeLinks, getVoiceGuides } from "@/services/songs";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SongForm from "../../nouveau/SongForm";

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { choirId } = await getAuthContext();

  const [{ data: song }, { data: ytLinks }, { data: lyricsData }, { data: voiceData }] = await Promise.all([
    getSong(id),
    getSongYoutubeLinks(id),
    getSongLyrics(id),
    getVoiceGuides(id),
  ]);

  if (!song) notFound();

  const initial = {
    ...song,
    youtube_links: ytLinks ?? [],
    lyrics:        lyricsData ?? [],
    voice_guides:  voiceData ?? [],
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-5 fade-in">
      <Link href={`/chants/${id}`} className="flex items-center gap-2 text-sm font-medium"
        style={{ color: "var(--text-2)" }}>
        <ArrowLeft className="w-4 h-4" /> Retour au chant
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-1)" }}>Modifier</h1>
        <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{song.title}</p>
      </div>
      <SongForm choirId={choirId ?? song.choir_id} initial={initial} />
    </div>
  );
}
