"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Separator } from "@/components/ui/separator";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import Image from "next/image";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  return (
    <footer className="bg-[var(--baby-charcoal)] text-gray-300">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="Pajama.mn"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-xl font-bold text-white">Pajama.mn</span>
            </div>
            <p className="text-sm leading-relaxed">{t("aboutText")}</p>
            <div className="flex gap-4 mt-4">
              <a
                href="https://instagram.com/pajama.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-pink-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/pajama.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center hover:bg-blue-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {t("quickLinks")}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-white transition-colors"
                >
                  {tc("home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors"
                >
                  {tc("products")}
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  className="hover:text-white transition-colors"
                >
                  {tc("cart")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("contact")}</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="tel:+97699111234" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+976 9911-1234</span>
                </a>
              </li>
              <li>
                <a href="mailto:hello@pajama.mn" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>hello@pajama.mn</span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Улаанбаатар, Монгол</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Pajama.mn.{" "}
            {tc("allRightsReserved")}.
          </p>
        </div>
      </div>
    </footer>
  );
}
