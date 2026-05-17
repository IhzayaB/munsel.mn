import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf7f1",
          color: "#111111",
          position: "relative",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 34,
            border: "1px solid rgba(198,151,63,0.28)",
            borderRadius: 92,
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            transform: "translateY(-6px)",
          }}
        >
          <div
            style={{
              fontSize: 236,
              lineHeight: 0.78,
              fontStyle: "italic",
              fontWeight: 700,
              letterSpacing: "-0.1em",
              transform: "translateX(-8px) rotate(-6deg)",
            }}
          >
            M
          </div>
          <div
            style={{
              marginTop: -8,
              fontSize: 28,
              letterSpacing: "0.34em",
              marginLeft: "0.34em",
              color: "#7a6340",
            }}
          >
            FINE JEWELRY
          </div>
        </div>
      </div>
    ),
    size
  );
}