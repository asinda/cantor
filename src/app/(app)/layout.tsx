import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-full min-h-screen">
      <div className="hidden md:flex">
        <Sidebar userName={user.user_metadata?.full_name ?? user.email?.split("@")[0]} />
      </div>
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
