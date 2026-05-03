"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, startTransition } from "react";
import { useCartStore } from "@/store/cart";

function ShippingSettingsLoader() {
  const fetchShippingSettings = useCartStore((s) => s.fetchShippingSettings);
  useEffect(() => {
    const w = window as Window & {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const run = () => {
      startTransition(() => {
        fetchShippingSettings();
      });
    };

    if (typeof w.requestIdleCallback === "function") {
      const idleId = w.requestIdleCallback(() => run(), { timeout: 1500 });
      return () => {
        if (typeof w.cancelIdleCallback === "function") {
          w.cancelIdleCallback(idleId);
        }
      };
    }

    const timeoutId = setTimeout(run, 300);
    return () => clearTimeout(timeoutId);
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
