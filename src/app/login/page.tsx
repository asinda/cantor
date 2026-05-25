"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music, BookOpen, Globe } from "lucide-react";
import CantorIcon from "@/components/CantorIcon";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError("Email ou mot de passe incorrect.");
    else router.push("/");
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Left — branding (desktop) */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0D0D1F 0%, #1A1040 50%, #0D0D1F 100%)" }}>

        {/* Grid pattern */}
        <div className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(127,119,221,0.12) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />

        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(127,119,221,0.25) 0%, transparent 70%)" }} />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(29,158,117,0.2) 0%, transparent 70%)" }} />

        <div className="relative flex items-center gap-3">
          <CantorIcon size={44} showText white />
        </div>

        <div className="relative space-y-8">
          <div>
            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Maîtrisez<br/>votre<br/>répertoire.
            </h1>
            <p className="mt-4 max-w-xs leading-relaxed text-base"
              style={{ color: "rgba(255,255,255,0.5)" }}>
              Plateforme intelligente pour chorales liturgiques multilingues.
            </p>
          </div>

          <div className="flex gap-3">
            {[
              { icon: Music,    text: "Répertoire multilingue" },
              { icon: Globe,    text: "FR · KI · SW · EN" },
              { icon: BookOpen, text: "Feuilles de messe" },
            ].map(({ icon: Icon, text }) => (
              <div key={text}
                className="flex-1 rounded-2xl p-3 text-center"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: "#7F77DD" }} />
                <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Pour chantres, chefs de chœur &amp; choristes
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <CantorIcon size={48} showText white />
          </div>

          <div className="space-y-2 mb-8">
            <h2 className="text-2xl font-black text-white tracking-tight">Connexion</h2>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>Accédez à votre espace de gestion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••" required autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm rounded-xl px-4 py-3"
                style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn btn-primary w-full justify-center py-3.5 text-sm font-bold mt-2">
              {loading ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-2)" }}>
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-semibold" style={{ color: "#7F77DD" }}>
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
