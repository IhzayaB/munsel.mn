"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Алдаа гарлаа</h2>
      <p className="text-muted-foreground mb-6 text-center max-w-md">
        {error.message || "Уучлаарай, алдаа гарлаа. Дахин оролдоно уу."}
      </p>
      <Button onClick={reset}>Дахин оролдох</Button>
    </div>
  );
}
