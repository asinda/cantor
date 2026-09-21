import Link from "next/link";
import CantorIcon from "@/components/CantorIcon";
import {
  Music, BookOpen, Calendar, Users, Globe, Mic2,
  CheckCircle, ArrowRight, Printer, PlayCircle
} from "lucide-react";

/* ── Données ── */
const FEATURES = [
  {
    icon: Music, color: "#A0621A", bg: "rgba(160,98,26,0.1)",
    title: "Bibliothèque de chants",
    desc: "Gérez tout votre répertoire. Paroles, partitions, guides vocaux, tonalité, tempo — tout au même endroit.",
  },
  {
    icon: Globe, color: "#4A7C59", bg: "rgba(74,124,89,0.1)",
    title: "Multilingue natif",
    desc: "Paroles en français, kirundi, swahili ou anglais sur le même chant. Idéal pour les chorales africaines.",
  },
  {
    icon: Mic2, color: "#6B3800", bg: "rgba(107,56,0,0.1)",
    title: "Guides vocaux",
    desc: "Note de départ, moment d'entrée et instructions par pupitre (soprano, alto, ténor, basse).",
  },
  {
    icon: Calendar, color: "#7C4A00", bg: "rgba(124,74,0,0.1)",
    title: "Répétitions planifiées",
    desc: "Date, heure, lieu et programme. Suivez le taux de maîtrise de chaque chant en séance.",
  },
  {
    icon: BookOpen, color: "#2D4F38", bg: "rgba(45,79,56,0.1)",
    title: "Feuilles de messe",
    desc: "Composez le programme de chaque célébration et imprimez une belle feuille avec paroles.",
  },
  {
    icon: Printer, color: "#5C3200", bg: "rgba(92,50,0,0.1)",
    title: "Impression PDF",
    desc: "Générez une feuille de messe propre avec les paroles de tous les chants en un clic.",
  },
  {
    icon: PlayCircle, color: "#9B0000", bg: "rgba(155,0,0,0.08)",
    title: "Intégration YouTube",
    desc: "Liez des vidéos YouTube à vos chants (version chorale, karaoké, SATB…) pour l'apprentissage.",
  },
  {
    icon: Users, color: "#4A4A8A", bg: "rgba(74,74,138,0.1)",
    title: "Gestion des membres",
    desc: "Invitez vos choristes avec un code unique. Gérez rôles et voix de chaque membre.",
  },
];

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg)", color: "var(--text-1)" }}>

      {/* ══ NAVBAR ══ */}
      <nav className="sticky top-0 z-50"
        style={{ background: "rgba(250,249,248,0.97)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/"><CantorIcon size={28} showText /></Link>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium"
              style={{ color: "var(--text-2)" }}>
              Connexion
            </Link>
            <Link href="/register" className="btn btn-primary btn-sm">
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="max-w-5xl mx-auto px-5 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{ background: "var(--gold-dim)", color: "var(--gold)", border: "1px solid var(--gold-border)" }}>
          ✦ Plateforme de gestion chorale
        </div>

        <h1 className="font-black tracking-tight leading-tight mb-5"
          style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)", color: "var(--text-1)" }}>
          Gérez votre chorale{" "}
          <span style={{
            background: "linear-gradient(135deg, #A0621A, #C98220)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            sans effort
          </span>
        </h1>

        <p className="text-lg leading-relaxed mb-8 mx-auto"
          style={{ color: "var(--text-2)", maxWidth: 580 }}>
          Répertoire multilingue, répétitions, feuilles de messe et guides vocaux —
          tout ce dont votre chorale a besoin en un seul outil.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register" className="btn btn-primary"
            style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
            Commencer gratuitement <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/login"
            className="btn btn-secondary"
            style={{ fontSize: "1rem", padding: "0.75rem 2rem" }}>
            Se connecter
          </Link>
        </div>

        <p className="text-xs mt-4" style={{ color: "var(--text-3)" }}>
          Aucune carte requise
        </p>
      </section>

      {/* ══ FEATURES ══ */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--text-1)" }}>
            Tout ce dont votre chorale a besoin
          </h2>
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            De la gestion du répertoire à l&apos;impression des feuilles de messe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, color, bg, title, desc }) => (
            <div key={title} className="card space-y-3 hover:border-color-2 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: bg }}>
                <Icon className="w-5 h-5" strokeWidth={2} style={{ color }} />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-2)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ POURQUOI CANTOR ══ */}
      <section style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-5xl mx-auto px-5 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-1)" }}>
                Conçu pour les chorales africaines et diaspora
              </h2>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-2)" }}>
                La plupart des outils de gestion musicale ignorent les réalités des chorales
                liturgiques d&apos;Afrique et de leur diaspora : plusieurs langues dans un même chant,
                partage sur mobile, impression PDF pour les paroisses sans Wi-Fi.
              </p>
              <div className="space-y-3">
                {[
                  "Paroles en FR, KI (Kirundi), SW (Swahili) et EN",
                  "Fonctionne sur mobile comme sur ordinateur",
                  "Accessible en zone à faible connectivité (PWA)",
                  "Import de chants existants depuis Word",
                  "Hébergement en Europe, données sécurisées",
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--gold)" }} />
                    <span className="text-sm" style={{ color: "var(--text-1)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", padding: "1.5rem" }}>
              <div className="space-y-3">
                {["Entrée", "Kyrie", "Gloria", "Psaume", "Alléluia", "Offertoire"].map((type, i) => (
                  <div key={type} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                    style={{ background: "var(--surface)" }}>
                    <div className="w-8 h-8 rounded-md flex-shrink-0"
                      style={{ background: [
                        "linear-gradient(135deg,#7c3aed,#db2777)",
                        "linear-gradient(135deg,#374151,#6B7280)",
                        "linear-gradient(135deg,#d97706,#ea580c)",
                        "linear-gradient(135deg,#059669,#0d9488)",
                        "linear-gradient(135deg,#b45309,#d97706)",
                        "linear-gradient(135deg,#0284c7,#0891b2)",
                      ][i] }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-1)" }}>{type}</p>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>FR · KI · SW</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(74,124,89,0.1)", color: "#4A7C59" }}>
                      Appris
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="max-w-3xl mx-auto px-5 py-20 text-center">
        <CantorIcon size={48} showText className="mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-3" style={{ color: "var(--text-1)" }}>
          Prêt à moderniser votre chorale ?
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-2)" }}>
          Rejoignez les chorales qui gèrent leur répertoire avec Cantor.
          Gratuit pour commencer, sans engagement.
        </p>
        <Link href="/register" className="btn btn-primary"
          style={{ fontSize: "1rem", padding: "0.875rem 2.5rem" }}>
          Créer mon espace <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ borderTop: "1px solid var(--border)" }}>
        <div className="max-w-6xl mx-auto px-5 py-8 flex items-center justify-between flex-wrap gap-4">
          <CantorIcon size={24} showText />
          <div className="flex gap-6">
            {[
              ["/login", "Connexion"],
              ["/register", "Créer un compte"],
            ].map(([href, label]) => (
              <Link key={label} href={href}
                className="text-xs" style={{ color: "var(--text-3)" }}>
                {label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            © {new Date().getFullYear()} Cantor
          </p>
        </div>
      </footer>
    </div>
  );
}
