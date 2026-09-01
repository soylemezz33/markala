import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getHeaderNav, getCategories } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";
import { CtaBanner } from "@/components/home/cta-banner";
import { ThemeBody } from "@/components/theme-body";
import { CartDrawerLazy } from "@/components/cart/cart-drawer-lazy";
import { OrganizationJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { Analytics } from "@/components/analytics";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { AttributionCapture } from "@/components/attribution-capture";
import { CookieConsent } from "@/components/cookie-consent";
import { WhatsAppOlcum } from "@/components/whatsapp-olcum";
import { FloatingActions } from "@/components/floating-actions";
import { WebVitals } from "@/components/web-vitals";
import { AuthBootstrap } from "@/components/auth-bootstrap";
import "./globals.css";

const fontSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://markala.com.tr"),
  title: {
    default: "Markala, Matbaa ve Reklam Ürünleri | 324 Ajans Çatısı",
    template: "%s · Markala",
  },
  description:
    "Kartvizitten branda afişe, broşürden kupaya 750+ matbaa & reklam ürünü. Ücretsiz tasarım desteği, 2-3 iş günü üretim, 81 ile kargo. 324 Ajans güvencesiyle.",
  applicationName: "Markala",
  authors: [{ name: "324 Ajans · Markala", url: "https://324ajans.com" }],
  creator: "324 Ajans",
  publisher: "Markala",
  category: "business",
  alternates: {
    canonical: "/",
    // hreflang / languages kasıtlı kaldırıldı: site tek dilli (Türkçe).
    // Çok dil eklenince buraya geri dön.
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Markala",
    url: "https://markala.com.tr",
    title: "Markala | Matbaa ve Reklam Ürünleri",
    description:
      "750+ matbaa ürünü, ücretsiz tasarım, 2-3 iş günü üretim, Türkiye geneli DHL kargo. 324 Ajans güvencesiyle.",
    images: [
      {
        // RASTER PNG (1200x630) — sosyal crawler'lar SVG'yi reddediyordu; statik PNG ile
        // Facebook/X/WhatsApp/LinkedIn önizlemeleri doğru görünür. public/og-default.png.
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Markala - Matbaa ve Reklam Ürünleri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala | Matbaa ve Reklam Ürünleri",
    description:
      "750+ matbaa ürünü, ücretsiz tasarım, hızlı kargo. 324 Ajans güvencesiyle.",
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
      noimageindex: false,
    },
  },
  formatDetection: { telephone: true, email: true, address: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F4E8" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1410" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Header menüsü — admin /menu yönetir (header_nav); yoksa SiteHeader DEFAULT_NAV'a düşer.
  // Kategoriler footer'ın "Tüm Kategoriler" bloğu için (SEO iç link, 2026-09-01).
  // İkisi de ISR önbellekli (/settings/header-nav ve /categories, revalidate 300) ve
  // paralel çekiliyor — ek gecikme yok. getCategories hatada [] döner, blok gizlenir.
  const [headerNav, kategoriler] = await Promise.all([getHeaderNav(), getCategories()]);
  const footerKategoriler = kategoriler.map((c) => ({ slug: c.slug, name: c.name }));
  return (
    <html lang="tr" className={fontSans.variable}>
      <head>
        {/* LCP hızlandırma: hero görseli api.markala.com.tr'den (cross-origin) gelir; reklam
            tıklamasında soğuk cache'te tarayıcı bağlantıyı erken kursun (DNS+TCP+TLS önden). */}
        <link rel="preconnect" href="https://api.markala.com.tr" />
        <link rel="dns-prefetch" href="https://api.markala.com.tr" />
        {/* 3. parti script origin'leri (PSI uses-rel-preconnect, ~350ms): gtag erken yüklenir →
            preconnect; fbevents lazyOnload olduğundan dns-prefetch yeterli (boşuna soket açma). */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
      </head>
      <body className="min-h-screen bg-paper-50 flex flex-col">
        {/* Skip-to-content link — WCAG 2.4.1 Bypass Blocks */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-brand-500 focus:text-ink-900 focus:px-4 focus:py-2 focus:rounded focus:font-semibold focus:shadow-lg"
        >
          Ana içeriğe atla
        </a>

        <ThemeBody />
        <AuthBootstrap />

        {/* Site FULL WIDTH — hero/carousel edge-to-edge kaplar; iç içerik genişliğini
            bölümlerin kendi <Container>'ı (max-w-content) sınırlar. */}
        <SiteHeader nav={headerNav ?? undefined} />
        <main id="main" className="flex-1">{children}</main>

        {/* CTA Banner — FULL WIDTH (footer öncesi conversion booster) */}
        <CtaBanner />

        {/* Footer — FULL WIDTH */}
        <SiteFooter categories={footerKategoriler} />

        <CartDrawerLazy />
        <FloatingActions />
        <CookieConsent />
        {/* Site geneli WhatsApp tıklama ölçümü (whatsapp_tikla) — görsel etkisi yok */}
        <WhatsAppOlcum />
        <Analytics />
        <AnalyticsTracker />
        {/* Sipariş kaynağı yakalama — çerez onayından BAĞIMSIZ (bkz. lib/attribution.ts).
            useSearchParams kullandığı için Suspense sınırı zorunlu. */}
        <Suspense fallback={null}>
          <AttributionCapture />
        </Suspense>
        <WebVitals />
      </body>
    </html>
  );
}
