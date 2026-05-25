import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SongForm from "../../nouveau/SongForm";

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: song }, { data: membership }, { data: ytLinks }, { data: lyricsData }, { data: voiceData }] = await Promise.all([
    supabase.from("songs").select("*").eq("id", id).single(),
    supabase.from("choir_members").select("choir_id").eq("user_id", user!.id).limit(1).single(),
    supabase.from("youtube_links").select("*").eq("song_id", id).order("is_primary", { ascending: false }),
    supabase.from("song_lyrics").select("*").eq("song_id", id),
    supabase.from("voice_guides").select("*").eq("song_id", id),
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
        <h1 className="text-2xl font-black text-white tracking-tight">Modifier</h1>
        <p className="text-sm mt-0.5 truncate" style={{ color: "var(--text-2)" }}>{song.title}</p>
      </div>
      <SongForm choirId={(membership as any)?.choir_id ?? song.choir_id} initial={initial} />
    </div>
  );
}
