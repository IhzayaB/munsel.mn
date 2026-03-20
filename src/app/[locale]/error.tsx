"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Image
        src="/logo.png"
        alt="Pajama.mn"
        width={80}
        height={80}
        className="rounded-full opacity-40 mb-6"
      />
      <h2 className="text-2xl font-bold mb-2">Алдаа гарлаа</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        {error.message || "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу."}
      </p>
      <Button onClick={reset} className="rounded-full">Дахин оролдох</Button>
    </div>
  );
}
