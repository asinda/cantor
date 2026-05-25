import { ImageResponse } from "next/og";

export const size        = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 64, height: 64,
        background: "#0B1B2B",
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Treble clef SVG — gold stroke on dark background */}
      <svg
        width={28} height={54}
        viewBox="0 0 50 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Spine */}
        <path d="M 22 5 L 22 82"
          stroke="#C9A227" strokeWidth="3.8" strokeLinecap="round" />
        {/* Top flag */}
        <path d="M 22 6 C 40 2, 46 16, 38 26 C 30 36, 22 34, 22 32"
          stroke="#C9A227" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Body oval */}
        <path d="M 22 28 C 24 18, 40 20, 40 36 C 40 52, 22 56, 12 48 C 4 40, 8 26, 22 28"
          stroke="#C9A227" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom spiral */}
        <path d="M 22 78 C 34 74, 38 84, 30 90 C 22 96, 8 94, 8 86 C 8 78, 16 73, 22 76"
          stroke="#C9A227" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>,
    { ...size },
  );
}
