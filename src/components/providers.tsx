"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useCartStore } from "@/store/cart";

function ShippingSettingsLoader() {
  const fetchShippingSettings = useCartStore((s) => s.fetchShippingSettings);
  useEffect(() => {
    fetchShippingSettings();
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
