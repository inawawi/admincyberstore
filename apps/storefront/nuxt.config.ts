import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  srcDir: ".",

  typescript: {
    tsConfig: {
      // srcDir includes the app root. Build output must not redefine globals
      // such as $fetch using the untyped, bundled production implementation.
      exclude: ["./.output", "./node_modules"].map((directory) =>
        fileURLToPath(new URL(directory, import.meta.url)),
      ),
    },
  },
  modules: ["@pinia/nuxt", "@nuxt/icon"],

  css: ["~/assets/css/main.css", "leaflet/dist/leaflet.css"],

  vite: {
    server: {
      allowedHosts: true,
    },
  },

  icon: {
    serverBundle: {
      collections: ["lucide"],
    },
    clientBundle: {
      scan: true,
    },
    localApiEndpoint: "/_nuxt_icon",
  },

  // ─── Security Headers & Backend Proxies ────────────────────────────────────
  routeRules: {
    "/api/_nuxt_icon/**": { headers: { "cache-control": "max-age=604800" } },
    "/api/**": { proxy: "http://127.0.0.1:3000/api/**" },
    "/storage/**": { proxy: "http://127.0.0.1:3000/storage/**" },
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        // HSTS: paksa HTTPS di production (browser akan otomatis redirect ke HTTPS)
        ...(process.env.NODE_ENV === "production" && {
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        }),
        // Content Security Policy — pertahanan utama terhadap XSS
        "Content-Security-Policy": [
          "default-src 'self'",
          // Script: izinkan Google Sign-In, Midtrans Snap, dan inline script Nuxt
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://app.sandbox.midtrans.com https://app.midtrans.com",
          // Style: izinkan Google Fonts dan inline style
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          // Font: izinkan Google Fonts
          "font-src 'self' https://fonts.gstatic.com",
          // Gambar: izinkan semua HTTPS + data URI untuk preview + HTTP lokal
          "img-src 'self' data: https: http: blob:",
          // Koneksi: izinkan API backend, Google OAuth, ngrok (dev), localhost dev ports, dan OSM/Photon Geocoder
          "connect-src 'self' https://cyberstore.kandangdev.com https://*.kandangdev.com http://localhost:* http://127.0.0.1:* https://localhost:* https://127.0.0.1:* https://accounts.google.com https://api.rajaongkir.com https://photon.komoot.io https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org",
          // Frame: izinkan Midtrans payment popup
          "frame-src 'self' https://app.sandbox.midtrans.com https://app.midtrans.com https://accounts.google.com",
          // Object: blokir plugin berbahaya seperti Flash
          "object-src 'none'",
          // Base URI: hanya dari origin yang sama
          "base-uri 'self'",
        ].join("; "),
      },
    },
  },


  // ─── Runtime Config ────────────────────────────────────────────────────────
  // Nilai publik yang aman diakses oleh frontend (client-side)
  runtimeConfig: {
    public: {
      // Base URL API backend (default proxy ke /api/v1)
      apiBase:
        (process.env.NUXT_PUBLIC_API_BASE ||
          "/api/v1").trim(),
      // Base URL storage/media (default proxy ke /storage)
      storageBase:
        (process.env.NUXT_PUBLIC_STORAGE_BASE ||
          "/storage").trim(),
      // Google OAuth Client ID (Public identifier)
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      googleRedirectUri: process.env.NUXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "",
      // Midtrans Snap (Sandbox: app.sandbox.midtrans.com | Prod: app.midtrans.com)
      midtransSnapUrl:
        process.env.NUXT_PUBLIC_MIDTRANS_SNAP_URL ||
        "https://app.sandbox.midtrans.com/snap/snap.js",
      midtransClientKey:
        process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY || "",
    },
  },

  app: {
    head: {
      title: "Cyber Store | Futuristic Tech & Lifestyle Gear",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Platform e-commerce gear teknologi, gadget, dan lifestyle modern terbaik dengan garansi resmi dan pengiriman kilat.",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;700&display=swap",
        },
        { rel: "icon", type: "image/x-icon", href: "/logo-cyberstore.ico" },

      ],
      script: [
        {
          src: "https://accounts.google.com/gsi/client",
          async: true,
          defer: true,
        },
      ],
    },
  },
});
