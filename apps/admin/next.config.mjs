import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  // Tip/lint kontrolü CI'da ayrı yapılır; production image build'ini bloklamasın
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
  compress: true,
  /**
   * İSTEMCİ YÖNLENDİRİCİ ÖNBELLEĞİ KAPALI (2026-09-03) — Hasan: "normal yenilediğimde
   * güncellemeleri almıyor, ctrl+shift+r yapınca alıyor".
   *
   * App Router, YUMUŞAK gezinmede (panel içi link tıklama, geri düğmesi) sayfanın RSC
   * çıktısını istemci belleğinde 30 saniye tutuyor. Panelde bu, "Siparişler'e git, geri
   * dön" hareketinde eski sipariş sayısı/tutarı görmek demek. Deneyle doğrulandı:
   * arka planda eklenen kayıt yumuşak gezinmeden sonra GÖRÜNMÜYOR, tam yenilemede
   * görünüyor.
   *
   * dynamic: 0 → dinamik sayfa hiç yeniden kullanılmaz, her gezinmede sunucudan gelir.
   * Panelde sayıların DOĞRU olması, gezinmenin bir tık daha hızlı olmasından önemli.
   * static: 180 → kod-tabanlı statik parçalar (giriş vb.) boşuna yeniden çekilmesin.
   */
  experimental: {
    staleTimes: { dynamic: 0, static: 180 },
  },
  transpilePackages: [
    "@markala/ui",
    "@markala/types",
    "@markala/api-client",
    "@markala/mock-data",
  ],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Admin paneli ASLA iframe'lenmemeli — clickjacking önle
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          // Admin paneli arama motorlarına asla görünmemeli
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT_ADMIN ?? process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
