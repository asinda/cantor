"use client";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteSheetButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Supprimer cette feuille de messe ?")) return;
    const supabase = createClient();
    await supabase.from("mass_sheets").delete().eq("id", id);
    router.push("/messe");
  }

  return (
    <button onClick={handleDelete} className="btn btn-danger" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
