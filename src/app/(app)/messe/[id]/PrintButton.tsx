"use client";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn btn-secondary btn-sm no-print"
      style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
      <Printer className="w-3.5 h-3.5" /> Imprimer
    </button>
  );
}
