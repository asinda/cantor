"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CantorIcon from "@/components/CantorIcon";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Mot de passe : 6 caractères minimum."); return; }
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (err) setError(err.message);
    else router.push("/onboarding");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-8">
          <CantorIcon size={48} showText white />
        </div>

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Créer un compte</h2>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>Rejoignez la plateforme</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Prénom / Nom</label>
            <input
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Marie Dupont" required
            />
          </div>
          <div>
            <label>Email</label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.fr" required autoComplete="email"
            />
          </div>
          <div>
            <label>Mot de passe</label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6 caractères minimum" required autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="text-sm rounded-xl px-4 py-3"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="btn btn-primary w-full justify-center py-3.5 text-sm font-bold">
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "var(--text-2)" }}>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold" style={{ color: "#7F77DD" }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
