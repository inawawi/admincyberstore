import type { NextConfig } from "next";
import path from "node:path";

import os from "node:os";

const workspaceRoot = path.resolve(process.cwd(), "../..");

function getDevOrigins(): string[] {
  const origins = new Set<string>([
    "cyberstore.kandangdev.com",
    "*.kandangdev.com",
    "172.16.*.*",
    "192.168.*.*",
    "10.*.*.*",
  ]);

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === "IPv4" && !iface.internal) {
          origins.add(iface.address);
        }
      }
    }
  } catch {
    // ignore
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const parsed = new URL(process.env.NEXT_PUBLIC_APP_URL);
      origins.add(parsed.hostname);
    } catch {
      // ignore
    }
  }

  if (process.env.ALLOWED_DEV_ORIGINS) {
    for (const origin of process.env.ALLOWED_DEV_ORIGINS.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) origins.add(trimmed);
    }
  }

  return Array.from(origins);
}

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // HSTS: hanya aktif di production agar tidak memblokir akses HTTP lokal
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  distDir: "next-build",
  output: "standalone",
  outputFileTracingRoot: workspaceRoot,
  poweredByHeader: false,
  allowedDevOrigins: getDevOrigins(),
  turbopack: {
    root: workspaceRoot,
  },
  headers: async () => [
    { source: "/(.*)", headers: securityHeaders },
  ],
  redirects: async () => [
    { source: "/orders", destination: "/admin/orders", permanent: false },
    { source: "/products", destination: "/admin/products", permanent: false },
    { source: "/categories", destination: "/admin/categories", permanent: false },
    { source: "/users", destination: "/admin/users", permanent: false },
    { source: "/expeditions", destination: "/admin/expeditions", permanent: false },
    { source: "/settings", destination: "/admin/settings", permanent: false },
    { source: "/dashboard", destination: "/admin", permanent: false },
  ],
};

export default nextConfig;
