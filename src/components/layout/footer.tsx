"use client";

import { useTranslations } from "next-intl";
import { Separator } from "@/components/ui/separator";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";

export function Footer() {
  const tc = useTranslations("common");
  const tf = useTranslations("footer");

  return (
    <footer className="bg-[var(--baby-charcoal)] text-gray-300">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand + socials */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Pajama.mn"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-xl font-bold text-white">Pajama.mn</span>
            </div>
            <p className="text-sm text-gray-400 text-center md:text-left max-w-xs">
              {tf("aboutText")}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/pajama.mn/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[var(--baby-peach)] transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/Pajama.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[var(--baby-teal)] transition-colors focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {tf("quickLinks")}
            </h3>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/" className="hover:text-white transition-colors">{tc("home")}</Link>
              <Link href="/products" className="hover:text-white transition-colors">{tc("products")}</Link>
              <Link href="/cart" className="hover:text-white transition-colors">{tc("cart")}</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              {tf("contact")}
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a href="tel:+97688029180" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+976 8802-9180</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@pajama.mn" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>info@pajama.mn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6 bg-gray-700" />

        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Pajama.mn. {tc("allRightsReserved")}.
        </p>
      </div>
    </footer>
  );
}
