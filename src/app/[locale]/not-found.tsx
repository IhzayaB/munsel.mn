"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";

export default function NotFound() {
  const tc = useTranslations("common");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Image
        src="/logo.jpg"
        alt="Munsel.mn"
        width={80}
        height={80}
        className="rounded-full opacity-40 mb-6"
      />
      <h2 className="text-2xl font-bold mb-2">{tc("notFoundTitle")}</h2>
      <p className="text-muted-foreground mb-6">
        {tc("notFoundDesc")}
      </p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-medium hover:opacity-90 transition-opacity"
      >
        {tc("goHome")}
      </Link>
    </div>
  );
}
