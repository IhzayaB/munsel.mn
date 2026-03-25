import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Providers } from "@/components/providers";
import { BackToTop } from "@/components/back-to-top";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm">
          Үндсэн хэсэг рүү шилжих
        </a>
        <Header />
        <main id="main-content" className="flex-1">{children}</main>
        <Footer />
        <BackToTop />
        <Toaster position="top-right" />
      </Providers>
    </NextIntlClientProvider>
  );
}
