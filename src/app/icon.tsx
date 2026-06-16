import { ImageResponse } from "next/og";

export const size        = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 64, height: 64,
        background: "#FAFAF8",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Monogramme C note — nouveau logo */}
      <svg width={44} height={44} viewBox="0 0 100 100" fill="none">
        {/* Arc C */}
        <path
          d="M 71.9,23.9 A 34,34 0 1,0 71.9,76.1"
          stroke="#B8721A"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tête de note */}
        <ellipse cx="62" cy="58" rx="9" ry="6"
          transform="rotate(-22 62 58)" fill="#B8721A" />
        {/* Hampe */}
        <line x1="70" y1="54" x2="70" y2="28"
          stroke="#B8721A" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>,
    { ...size },
  );
}
