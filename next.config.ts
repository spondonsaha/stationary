import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  /**
   * Inline server-side env into the client bundle at build time so cart/checkout
   * UI always matches the configured currency, tax rate and store name. Server
   * components read the live values directly.
   */
  env: {
    NEXT_PUBLIC_STORE_NAME:
      process.env.STORE_NAME ?? process.env.SHOP_NAME ?? "University Bookstore",
    NEXT_PUBLIC_UNIVERSITY_NAME: process.env.UNIVERSITY_NAME ?? "Northgate University",
    NEXT_PUBLIC_CURRENCY: process.env.CURRENCY ?? "USD",
    NEXT_PUBLIC_TAX_RATE: process.env.TAX_RATE ?? "8.5",
  },
  images: {
    // Product photos plus occasional SVG uploads from the admin.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536],
    // Admin uploads go to Cloudinary when CLOUDINARY_URL is set; allow its CDN
    // so next/image can optimize and serve the remote URLs.
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;
