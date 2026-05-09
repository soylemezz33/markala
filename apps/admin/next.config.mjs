/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@markala/ui", "@markala/types", "@markala/api-client"],
};

export default nextConfig;
