"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="mn">
      <body>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Алдаа гарлаа</h2>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "0.5rem", background: "#409ba0", color: "#fff", border: "none", cursor: "pointer", fontSize: "1rem" }}
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
