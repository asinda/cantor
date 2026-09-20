"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import CantorIcon from "@/components/CantorIcon";
import { createClient } from "@/lib/supabase/client";

const BG_IMAGE = "https://images.unsplash.com/photo-1638534958793-b198c7635575?w=1920&q=85&fit=crop";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--bg)" }} />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState(
    searchParams.get("error") === "auth_failed"
      ? "Connexion Google annulée ou échouée. Réessayez."
      : searchParams.get("error")
        ? decodeURIComponent(searchParams.get("error") ?? "")
        : ""
  );
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => { createClient().auth.signOut(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError("Email ou mot de passe incorrect.");
    else router.push("/dashboard");
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      const msg = err.message?.includes("not enabled") || err.status === 400
        ? "La connexion Google n'est pas encore activée. Utilisez email + mot de passe."
        : "Erreur Google. Réessayez.";
      setError(msg);
      setGoogleLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>

      {/* ══ FOND PLEIN ÉCRAN — photo ══ */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BG_IMAGE}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center",
          zIndex: 0,
        }}
      />

      {/* Overlay sombre dégradé */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: `
          linear-gradient(135deg,
            rgba(10,6,2,0.82) 0%,
            rgba(15,9,3,0.55) 50%,
            rgba(10,6,2,0.7) 100%
          )
        `,
      }} />

      {/* ══ CONTENU ══ */}
      <div style={{ position: "relative", zIndex: 2 }}
        className="min-h-screen flex flex-col lg:flex-row">

        {/* ── Gauche : phrase d'approche ── */}
        <div className="flex-1 flex flex-col justify-between p-10 lg:p-14">

          {/* Logo cliquable — fond semi-transparent pour visibilité */}
          <Link href="/" className="inline-block w-fit px-3 py-2 rounded-xl"
            style={{ background: "rgba(0,0,0,0.25)", backdropFilter: "blur(8px)" }}>
            <CantorIcon size={34} showText white />
          </Link>

          {/* Phrase d'approche — bien visible */}
          <div className="mt-auto mb-0 lg:mb-16">
            <h1 className="font-black leading-tight text-white"
              style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)", letterSpacing: "-0.02em",
                textShadow: "0 2px 16px rgba(0,0,0,0.4)" }}>
              La musique est<br />
              <span style={{
                background: "linear-gradient(135deg, #F5C842, #C98220)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                la prière du cœur.
              </span>
            </h1>
          </div>
        </div>

        {/* ── Droite : formulaire ── */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">

          <div className="w-full" style={{ maxWidth: 380 }}>

            {/* Card formulaire */}
            <div style={{
              background: "rgba(255,253,248,0.97)",
              backdropFilter: "blur(32px)",
              WebkitBackdropFilter: "blur(32px)",
              borderRadius: "1.25rem",
              padding: "2rem",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)",
            }}>

              {/* Logo dans le formulaire (mobile) */}
              <div className="lg:hidden flex justify-center mb-6">
                <Link href="/">
                  <CantorIcon size={32} showText />
                </Link>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>
                  Connexion
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
                  Accédez à votre espace
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label>Email</label>
                  <input type="email" value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    required autoComplete="email" />
                </div>
                <div>
                  <label>Mot de passe</label>
                  <input type="password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required autoComplete="current-password" />
                </div>

                {error && (
                  <div className="text-sm rounded-lg px-3 py-2.5"
                    style={{ background: "rgba(192,57,43,0.07)", color: "var(--red)",
                      border: "1px solid rgba(192,57,43,0.18)" }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="btn btn-primary w-full justify-center"
                  style={{ borderRadius: "0.625rem", padding: "0.75rem" }}>
                  {loading ? "Connexion…" : "Se connecter"}
                </button>
              </form>

              {/* Séparateur */}
              <div className="flex items-center gap-3 my-5">
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                <span className="text-xs" style={{ color: "var(--text-3)" }}>ou</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* Bouton Google */}
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 font-semibold transition-all"
                style={{
                  padding: "0.75rem",
                  borderRadius: "0.625rem",
                  background: "white",
                  border: "1px solid var(--border-2)",
                  color: "var(--text-1)",
                  fontSize: "0.875rem",
                  cursor: googleLoading ? "not-allowed" : "pointer",
                  opacity: googleLoading ? 0.6 : 1,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                {/* Logo Google SVG */}
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {googleLoading ? "Redirection…" : "Continuer avec Google"}
              </button>

              <p className="text-center text-sm mt-5" style={{ color: "var(--text-2)" }}>
                Pas encore de compte ?{" "}
                <Link href="/register" className="font-semibold"
                  style={{ color: "var(--gold)" }}>
                  Créer un compte
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
