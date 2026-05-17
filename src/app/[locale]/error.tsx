"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tc = useTranslations("common");

  useEffect(() => {
    console.error("App error:", error.message, error.digest);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Image
        src="/logo.jpg"
        alt="Munsel.mn"
        width={80}
        height={80}
        className="rounded-full opacity-40 mb-6"
      />
      <h2 className="text-2xl font-bold mb-2">{tc("errorTitle")}</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        {tc("errorDesc")}
      </p>
      <Button onClick={reset} className="rounded-full">{tc("retry")}</Button>
    </div>
  );
}
