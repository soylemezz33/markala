import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const securityHeaders = [
  // XSS protection (older browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // MIME sniffing protection
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Iframe protection (default — widget routes override)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Strict transport security — Cloudflare yine yapacak ama ekstra koruma
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Referrer policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Permissions policy — kamera/mikrofon/jeolokasyon kapalı
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(self), payment=(self), interest-cohort=()",
  },
  // Cross-origin policies
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig = {
  reactStrictMode: true,
  // Production: standalone output → küçük Docker image, no node_modules at runtime
  output: "standalone",
  experimental: {
    // @phosphor-icons/react barrel import'u (tüm site genelinde) → yalnız kullanılan
    // ikonlar bundle'a girsin (tree-shake). first-load JS düşer, LCP/TBT iyileşir.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  // Tip/lint kontrolü CI'da ayrı yapılır; production image build'ini bloklamasın
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Compress responses (gzip)
  compress: true,
  // Production'da X-Powered-By: Next.js header'ı kaldır
  poweredByHeader: false,
  transpilePackages: ["@markala/ui", "@markala/types", "@markala/mock-data", "@markala/api-client"],
  images: {
    formats: ["image/avif", "image/webp"],
    // Mockup endpoint SVG döndürdüğü için aktif — kendi origin'imiz olduğu için güvenli
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    // 1 yıl cache (Cloudflare ile uyumlu)
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  async headers() {
    return [
      {
        // Tüm sayfalar için güvenlik header'ları
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Embeddable widget — partner sitelere iframe ile gömülebilir (override)
        source: "/widget/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
      {
        // Statik asset'ler için 1 yıl immutable cache
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // API endpoint'leri için no-cache
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Eski URL'ler → yeni
      {
        source: "/anasayfa",
        destination: "/",
        permanent: true,
      },
      {
        source: "/iletisim-formu",
        destination: "/iletisim",
        permanent: true,
      },
    ];
  },
};

// Sentry wrapper — kaynak haritalarını upload eder, hata izlemeyi etkinleştirir.
// SENTRY_AUTH_TOKEN env değişkeni build sırasında set edilmezse upload sessizce
// atlanır ve build kırılmaz (silent: true).
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // SENTRY_AUTH_TOKEN yoksa upload aşamasını atla — local build kırılmasın
  dryRun: !process.env.SENTRY_AUTH_TOKEN,
};

// Bundle analyzer → Sentry wrapper sırası: önce analyzer, sonra Sentry
// ANALYZE=true pnpm build ile çalıştır
export default withBundleAnalyzer(
  withSentryConfig(nextConfig, sentryWebpackPluginOptions),
);
