import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #faf7f1 0%, #f3eadc 100%)",
          color: "#111111",
          position: "relative",
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 26,
            border: "1px solid rgba(198,151,63,0.35)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            transform: "translateY(-8px)",
          }}
        >
          <div
            style={{
              fontSize: 248,
              lineHeight: 0.78,
              fontStyle: "italic",
              fontWeight: 700,
              letterSpacing: "-0.1em",
              transform: "translateX(-10px) rotate(-6deg)",
            }}
          >
            M
          </div>
          <div
            style={{
              marginTop: -8,
              fontSize: 32,
              letterSpacing: "0.42em",
              marginLeft: "0.42em",
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