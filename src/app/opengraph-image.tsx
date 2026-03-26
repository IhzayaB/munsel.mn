import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default function OGImage() {
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
          background: "linear-gradient(135deg, #f5fafa 0%, #e4f1f2 50%, #cde0e1 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#409ba0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            boxShadow: "0 8px 32px rgba(64, 155, 160, 0.3)",
          }}
        >
          <span style={{ fontSize: 56, color: "white" }}>🧸</span>
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#2c3e3f",
            letterSpacing: "-2px",
            marginBottom: 12,
          }}
        >
          Pajama.mn
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#409ba0",
            fontWeight: 600,
            marginBottom: 40,
          }}
        >
          Нярайн хувцасны онлайн дэлгүүр
        </div>

        {/* Decorative bar */}
        <div
          style={{
            width: 80,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #409ba0, #f5c89a)",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
