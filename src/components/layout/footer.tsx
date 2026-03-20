"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");

  return (
    <footer className="bg-[var(--baby-charcoal)] text-gray-300">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🧸</span>
              <span className="text-xl font-bold text-white">Pajama.mn</span>
            </div>
            <p className="text-sm leading-relaxed">{t("aboutText")}</p>
            <div className="flex gap-3 mt-4">
              <a
                href="https://instagram.com/pajama.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-pink-400 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com/pajama.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
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
            <ul className="space-y-2 text-sm">
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

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              {t("customerService")}
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("faq")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("returns")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("shipping")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("privacy")}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  {t("terms")}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="text-white font-semibold mb-4">{t("contact")}</h3>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+976 9911-1234</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>hello@pajama.mn</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Улаанбаатар, Монгол</span>
              </li>
            </ul>

            <h4 className="text-white font-semibold mb-2">
              {t("newsletter")}
            </h4>
            <p className="text-xs mb-2">{t("newsletterText")}</p>
            <form className="flex gap-2">
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
              />
              <Button size="sm" type="submit">
                {t("subscribe")}
              </Button>
            </form>
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
