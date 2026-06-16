import { getAuthContext } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import TopBar from "@/components/layout/TopBar";
import MiniPlayer from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/context/PlayerContext";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userName, choirName } = await getAuthContext();

  return (
    <PlayerProvider>
      <div className="flex h-full min-h-screen" style={{ background: "var(--bg)" }}>

        {/* ── DESKTOP : sidebar ── */}
        <div className="hidden md:flex">
          <Sidebar userName={userName ?? undefined} />
        </div>

        {/* ── Colonne principale ── */}
        <div className="flex flex-col flex-1 min-w-0">

          {/* Top bar mobile */}
          <TopBar userName={userName} choirName={choirName} />

          {/* Contenu */}
          <main className="flex-1 overflow-auto pb-20 md:pb-6">
            {children}
          </main>
        </div>

        {/* ── MOBILE : bottom nav ── */}
        <BottomNav />
        <MiniPlayer />
      </div>
    </PlayerProvider>
  );
}
