import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 36,
          background: "linear-gradient(135deg, #D4A574, #C9956A, #B8843C)",
          fontSize: 96,
          color: "#09090B",
        }}
      >
        ✦
      </div>
    ),
    { ...size }
  );
}
