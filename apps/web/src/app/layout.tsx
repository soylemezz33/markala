import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { getHeaderNav } from "@/lib/catalog";
import { SiteFooter } from "@/components/site-footer";
import { CtaBanner } from "@/components/home/cta-banner";
import { ThemeBody } from "@/components/theme-body";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { OrganizationJsonLd, LocalBusinessJsonLd } from "@/components/seo/json-ld";
import { Analytics } from "@/components/analytics";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { CookieConsent } from "@/components/cookie-consent";
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
    default: "Markala — Matbaa ve Reklam Ürünleri | 324 Ajans Çatısı",
    template: "%s · Markala",
  },
  description:
    "Kartvizitten branda afişe, broşürden kupaya 800+ matbaa & reklam ürünü. Ücretsiz tasarım desteği, 1-2 iş günü üretim, 81 il DHL kargo. 324 Ajans güvencesiyle markala.com.tr.",
  applicationName: "Markala",
  authors: [{ name: "324 Ajans · Markala", url: "https://324ajans.com" }],
  creator: "324 Ajans",
  publisher: "Markala",
  keywords: [
    "matbaa", "reklam ürünleri", "kartvizit baskı", "broşür baskı",
    "afiş baskı", "branda baskı", "kupa baskı", "kaşe baskı", "etiket baskı",
    "antetli kağıt", "zarf baskı", "magnet baskı", "promosyon ürünleri",
    "online matbaa", "324 ajans", "markala", "markala.com.tr",
    "mersin matbaa", "türkiye matbaa", "ucuz kartvizit", "hızlı baskı",
  ],
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
    title: "Markala — Matbaa ve Reklam Ürünleri",
    description:
      "800+ matbaa ürünü, ücretsiz tasarım, 1-2 iş günü üretim, Türkiye geneli DHL kargo. 324 Ajans güvencesiyle.",
    images: [
      {
        // RASTER PNG (1200x630) — sosyal crawler'lar SVG'yi reddediyordu; statik PNG ile
        // Facebook/X/WhatsApp/LinkedIn önizlemeleri doğru görünür. public/og-default.png.
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Markala — Matbaa ve Reklam Ürünleri",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Markala — Matbaa ve Reklam Ürünleri",
    description:
      "800+ matbaa ürünü, ücretsiz tasarım, hızlı kargo. 324 Ajans güvencesiyle.",
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
  const headerNav = await getHeaderNav();
  return (
    <html lang="tr" className={fontSans.variable}>
      <head>
        {/* LCP hızlandırma: hero görseli api.markala.com.tr'den (cross-origin) gelir; reklam
            tıklamasında soğuk cache'te tarayıcı bağlantıyı erken kursun (DNS+TCP+TLS önden). */}
        <link rel="preconnect" href="https://api.markala.com.tr" />
        <link rel="dns-prefetch" href="https://api.markala.com.tr" />
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

        {/* Site wrapper — sabit max genişlik (1440), kenarlarda görsel ayrım YOK */}
        <div
          className="mx-auto w-full flex flex-col flex-1"
          style={{ maxWidth: "1440px" }}
        >
          <SiteHeader nav={headerNav ?? undefined} />
          <main id="main" className="flex-1">{children}</main>
        </div>

        {/* CTA Banner — FULL WIDTH (footer öncesi conversion booster) */}
        <CtaBanner />

        {/* Footer — FULL WIDTH */}
        <SiteFooter />

        <CartDrawer />
        <FloatingActions />
        <CookieConsent />
        <Analytics />
        <AnalyticsTracker />
        <WebVitals />
      </body>
    </html>
  );
}
