type Props = {
  size?: number;
  white?: boolean;
  showText?: boolean;
  className?: string;
};

/**
 * Logo Cantor — Monogramme "C note"
 * Un arc C géométrique pur + tête de note dans l'ouverture.
 * Minimaliste, moderne, scalable de 16px à 200px.
 */
export default function CantorIcon({
  size = 40,
  white = false,
  showText = false,
  className,
}: Props) {
  const id = `ci-${size}-${white ? "w" : "c"}`;
  const clr = white ? "white" : `url(#${id})`;
  const goldA = white ? "white" : "#B8721A";
  const goldB = white ? "white" : "#9A5E12";

  return (
    <div
      className={className}
      style={{ display: "inline-flex", alignItems: "center",
        gap: Math.round(size * 0.28), lineHeight: 1 }}
    >
      {/* ── Icône ── */}
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
      >
        <defs>
          {!white && (
            <linearGradient id={id} x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%"   stopColor="#C98220" />
              <stop offset="100%" stopColor="#8A520E" />
            </linearGradient>
          )}
        </defs>

        {/*
          Arc C géométrique — 260° (ouverture ±50° sur la droite)
          Centre (50,50), rayon 34
          Extrémité haute : (50+34·cos(-50°), 50+34·sin(-50°)) = (71.9, 23.9)
          Extrémité basse : (71.9, 76.1)
        */}
        <path
          d="M 71.9,23.9 A 34,34 0 1,0 71.9,76.1"
          stroke={clr}
          strokeWidth="8.5"
          strokeLinecap="round"
          fill="none"
        />

        {/*
          Tête de note — ovale dans l'ouverture du C, légèrement sous le centre
          Positionnée naturellement dans la "fenêtre" du C
        */}
        <ellipse
          cx="62"
          cy="58"
          rx="9"
          ry="6"
          transform="rotate(-22 62 58)"
          fill={clr}
        />

        {/*
          Hampe — fine ligne montant de la note vers le haut de l'ouverture
          Crée la lisibilité "note de musique"
        */}
        <line
          x1="70"
          y1="54"
          x2="70"
          y2="28"
          stroke={clr}
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>

      {/* ── Wordmark ── */}
      {showText && (
        <span
          aria-label="Cantor"
          style={{
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontWeight: 800,
            fontSize: size * 0.58,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            ...(white
              ? { color: "white" }
              : {
                  background: `linear-gradient(135deg, ${goldA} 0%, ${goldB} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }),
          }}
        >
          Cantor
        </span>
      )}
    </div>
  );
}
