"use client";
import { Trash2 } from "lucide-react";
import { deleteRehearsalAction } from "@/actions/repetitions";

export default function DeleteRehearsalButton({ id }: { id: string }) {
  async function handleDelete() {
    if (!confirm("Supprimer cette répétition ?")) return;
    await deleteRehearsalAction(id);
  }

  return (
    <button onClick={handleDelete} className="btn btn-danger" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}
