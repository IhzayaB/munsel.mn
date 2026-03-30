"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, startTransition } from "react";
import { useCartStore } from "@/store/cart";

function ShippingSettingsLoader() {
  const fetchShippingSettings = useCartStore((s) => s.fetchShippingSettings);
  useEffect(() => {
    // Defer non-critical fetch so it doesn't block first paint
    startTransition(() => {
      fetchShippingSettings();
    });
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
