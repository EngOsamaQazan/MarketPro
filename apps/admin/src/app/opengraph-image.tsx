import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "سطوة — منصة التسويق الرقمي بالذكاء الاصطناعي";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontData = await fetch(
    "https://fonts.gstatic.com/s/ibmplexsansarabic/v12/Qw3CZRtWPQCuHme67tEYUIx3Kh0PHR9N6YNe3PC5eMlAMg0.woff"
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090B 0%, #111113 40%, #18181B 100%)",
          fontFamily: '"IBM Plex Sans Arabic"',
          direction: "rtl",
          position: "relative",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 88,
            height: 88,
            borderRadius: 20,
            background: "linear-gradient(135deg, #D4A574, #C9956A, #B8843C)",
            boxShadow: "0 0 40px rgba(212,165,116,0.3)",
            marginBottom: 32,
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#09090B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: "#FAFAFA",
            letterSpacing: "-0.02em",
            marginBottom: 16,
          }}
        >
          سطوة
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "#A1A1AA",
            textAlign: "center",
            maxWidth: 700,
            lineHeight: 1.6,
          }}
        >
          منصة التسويق الرقمي بالذكاء الاصطناعي
        </div>

        {/* Separator line */}
        <div
          style={{
            width: 80,
            height: 3,
            borderRadius: 2,
            background: "linear-gradient(90deg, #D4A574, #C9956A)",
            marginTop: 28,
            marginBottom: 28,
          }}
        />

        {/* Features */}
        <div
          style={{
            display: "flex",
            gap: 32,
            fontSize: 18,
            color: "#71717A",
          }}
        >
          <span>حملات إعلانية</span>
          <span style={{ color: "#3F3F46" }}>•</span>
          <span>محتوى ذكي</span>
          <span style={{ color: "#3F3F46" }}>•</span>
          <span>تقارير تلقائية</span>
          <span style={{ color: "#3F3F46" }}>•</span>
          <span>أتمتة كاملة</span>
        </div>

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 16,
            color: "#D4A574",
            fontWeight: 500,
          }}
        >
          www.satwa.ai
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "IBM Plex Sans Arabic",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
