"use client";

import dynamic from "next/dynamic";

export const BackToTop = dynamic(
  () => import("@/components/back-to-top").then((m) => m.BackToTop),
  { ssr: false }
);

export const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false }
);
