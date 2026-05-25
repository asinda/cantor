type Props = {
  /** Height in px — width auto-scales (treble clef is ~0.55:1 ratio) */
  size?: number;
  /** White mode for use on colored/gradient backgrounds */
  white?: boolean;
  /** Show "Cantor" wordmark next to the clef */
  showText?: boolean;
  className?: string;
};

export default function CantorIcon({
  size = 40,
  white = false,
  showText = false,
  className,
}: Props) {
  const w = Math.round(size * 0.55);
  const id = `cg${size}${white ? "w" : "c"}`;
  const stroke = white ? "white" : `url(#${id})`;
  const sw = 3.2;

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.22,
        lineHeight: 1,
      }}
    >
      {/* ── Treble clef SVG ── */}
      <svg
        viewBox="0 0 50 100"
        width={w}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block", flexShrink: 0 }}
      >
        <defs>
          {!white && (
            <linearGradient
              id={id}
              x1="25" y1="5" x2="25" y2="95"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#7F77DD" />
              <stop offset="55%" stopColor="#5B8FCC" />
              <stop offset="100%" stopColor="#1D9E75" />
            </linearGradient>
          )}
        </defs>

        {/* Spine — long vertical stem */}
        <path
          d="M 22 5 L 22 82"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />

        {/* Top flag curl — swings right from top of spine */}
        <path
          d="M 22 6 C 40 2, 46 16, 38 26 C 30 36, 22 34, 22 32"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Body oval — the G-clef wrapping around the G line */}
        <path
          d="M 22 28 C 24 18, 40 20, 40 36 C 40 52, 22 56, 12 48 C 4 40, 8 26, 22 28"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Bottom spiral foot */}
        <path
          d="M 22 78 C 34 74, 38 84, 30 90 C 22 96, 8 94, 8 86 C 8 78, 16 73, 22 76"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* ── Wordmark ── */}
      {showText && (
        <span
          aria-label="Cantor"
          style={{
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            fontWeight: 900,
            fontSize: size * 0.62,
            letterSpacing: "-0.035em",
            lineHeight: 1,
            ...(white
              ? { color: "white" }
              : {
                  background: "linear-gradient(135deg, #7F77DD 0%, #1D9E75 100%)",
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
