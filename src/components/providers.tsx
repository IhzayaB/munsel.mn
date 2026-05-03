"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, startTransition } from "react";
import { useCartStore } from "@/store/cart";

function ShippingSettingsLoader() {
  const fetchShippingSettings = useCartStore((s) => s.fetchShippingSettings);
  useEffect(() => {
    const run = () => {
      startTransition(() => {
        fetchShippingSettings();
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => run(), { timeout: 1500 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(run, 300);
    return () => window.clearTimeout(timeoutId);
  }, [fetchShippingSettings]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ShippingSettingsLoader />
      {children}
    </SessionProvider>
  );
}
