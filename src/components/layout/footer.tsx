import { getTranslations } from "next-intl/server";
import { Separator } from "@/components/ui/separator";
import { Instagram, Facebook, Mail, Phone } from "lucide-react";
import { Link } from "@/i18n/routing";
import Image from "next/image";

export async function Footer() {
  const tc = await getTranslations("common");
  const tf = await getTranslations("footer");

  return (
    <footer className="bg-[var(--charcoal)] text-gray-300">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-7 sm:gap-8">
          {/* Brand + socials */}
          <div className="sm:col-span-2 md:col-span-2 flex flex-col items-center sm:items-start gap-3 sm:gap-4">
            <div className="flex flex-col items-center sm:items-start gap-3">
              <Image
                src="/logo-white.png"
                alt="Munsel.mn"
                width={220}
                height={84}
                className="h-10 sm:h-11 w-auto"
              />
              <p className="font-brand text-[11px] uppercase tracking-[0.34em] text-white/70">
                Fine Jewelry
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/munsel.mn/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[var(--gold)] hover:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/munsel.mn"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 sm:h-9 sm:w-9 rounded-full bg-gray-700 flex items-center justify-center hover:bg-[var(--gold)] hover:text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col items-center sm:items-start gap-2 sm:gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-[0.18em]">
              {tf("quickLinks")}
            </h3>
            <nav className="flex flex-col items-center sm:items-start gap-2 text-sm">
              <Link href="/" className="hover:text-white transition-colors duration-200 py-1">{tc("home")}</Link>
              <Link href="/products" className="hover:text-white transition-colors duration-200 py-1">{tc("products")}</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center sm:items-start gap-2 sm:gap-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-[0.18em]">
              {tf("contact")}
            </h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <a href="tel:+97688029180" className="flex items-center gap-2 hover:text-white transition-colors duration-200 py-1">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span>+976 8802-9180</span>
                </a>
              </li>
              <li>
                <a href="mailto:info@munsel.mn" className="flex items-center gap-2 hover:text-white transition-colors duration-200 py-1">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span>info@munsel.mn</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-6 bg-gray-700" />

        <p className="text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Munsel.mn. {tc("allRightsReserved")}. 
        </p>
      </div>
    </footer>
  );
}
