import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ["cloudinary", "postgres"],
  experimental: {
    optimizePackageImports: ["lucide-react", "sonner"],
  },
  images: {
    // Custom loader: serves Cloudinary images directly from Cloudinary CDN
    // with f_auto/q_auto/w_{size} transforms, bypassing Vercel Image Optimization.
    // This eliminates all Vercel image transformation/cache usage.
    loaderFile: "./src/lib/image-loader.ts",
    // These control the srcSet widths Next.js generates (still relevant with custom loader)
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [48, 80, 160, 320, 480],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https://res.cloudinary.com https://qpay.mn https://*.qpay.mn data: blob:; font-src 'self' data:; connect-src 'self' https://merchant.qpay.mn https://api.cloudinary.com https://*.upstash.io; frame-ancestors 'none';",
          },
        ],
      },
      {
        source: "/logo.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/pajama-text.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/favicon.ico",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
