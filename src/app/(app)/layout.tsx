import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import MiniPlayer from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/context/PlayerContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <PlayerProvider>
      <div className="flex h-full min-h-screen">
        <div className="hidden md:flex">
          <Sidebar userName={user.user_metadata?.full_name ?? user.email?.split("@")[0]} />
        </div>
        <main className="flex-1 overflow-auto pb-28 md:pb-20">
          {children}
        </main>
        <BottomNav />
        <MiniPlayer />
      </div>
    </PlayerProvider>
  );
}
