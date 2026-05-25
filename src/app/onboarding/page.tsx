"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Users } from "lucide-react";
import CantorIcon from "@/components/CantorIcon";
import { createClient } from "@/lib/supabase/client";

type Tab = "create" | "join";

export default function OnboardingPage() {
  const router = useRouter();
  const [tab,       setTab]       = useState<Tab>("create");
  const [name,      setName]      = useState("");
  const [desc,      setDesc]      = useState("");
  const [code,      setCode]      = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Le nom est requis."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: choir, error: err } = await supabase
      .from("choirs")
      .insert({ name: name.trim(), description: desc || null, owner_id: user.id })
      .select("id")
      .single();

    if (err || !choir) { setError(err?.message ?? "Erreur lors de la création."); setLoading(false); return; }

    await supabase.from("choir_members").insert({
      choir_id: choir.id, user_id: user.id, role: "chef",
    });

    router.push("/");
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) { setError("Le code est requis."); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: choir, error: err } = await supabase
      .from("choirs")
      .select("id,name")
      .eq("invite_code", code.trim().toLowerCase())
      .single();

    if (err || !choir) {
      setError("Code invalide. Vérifiez le code et réessayez.");
      setLoading(false); return;
    }

    const { error: joinErr } = await supabase.from("choir_members").insert({
      choir_id: choir.id, user_id: user.id, role: "choriste",
    });

    if (joinErr) { setError(joinErr.message); setLoading(false); return; }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10 text-center">
          <CantorIcon size={56} showText />
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Bienvenue sur Cantor</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
              Créez ou rejoignez votre chorale pour commencer.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl p-1 mb-5"
          style={{ background: "var(--surface-2)" }}>
          {([["create", "Créer une chorale"], ["join", "Rejoindre"]] as [Tab, string][]).map(([t, label]) => (
            <button key={t} type="button" onClick={() => { setTab(t); setError(""); }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: tab === t ? "var(--violet)" : "transparent",
                color: tab === t ? "white" : "var(--text-2)",
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Create */}
        {tab === "create" && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="w-4 h-4" style={{ color: "#7F77DD" }} />
                <p className="font-bold text-sm text-white">Nouvelle chorale</p>
              </div>
              <div>
                <label>Nom de la chorale *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Chœur Céleste de Kigali" required />
              </div>
              <div>
                <label>Description</label>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Décrivez votre chorale…" rows={2} />
              </div>
            </div>

            {error && (
              <div className="text-sm rounded-xl px-4 py-3"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3.5">
              {loading ? "Création…" : "Créer ma chorale"}
            </button>
          </form>
        )}

        {/* Join */}
        {tab === "join" && (
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4" style={{ color: "#7F77DD" }} />
                <p className="font-bold text-sm text-white">Rejoindre une chorale</p>
              </div>
              <div>
                <label>Code d'invitation</label>
                <input value={code} onChange={(e) => setCode(e.target.value)}
                  placeholder="ABC123" required
                  className="uppercase tracking-widest text-center font-bold"
                />
              </div>
              <p className="text-xs" style={{ color: "var(--text-2)" }}>
                Demandez le code à votre chef de chœur.
              </p>
            </div>

            {error && (
              <div className="text-sm rounded-xl px-4 py-3"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center py-3.5">
              {loading ? "Recherche…" : "Rejoindre"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
