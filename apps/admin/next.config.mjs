/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  poweredByHeader: false,
  compress: true,
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

export default nextConfig;
