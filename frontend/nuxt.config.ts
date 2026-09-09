// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  srcDir: ".",

  modules: ["@pinia/nuxt", "@nuxt/icon"],

  css: ["~/assets/css/main.css", "leaflet/dist/leaflet.css"],

  // ─── Security Headers ──────────────────────────────────────────────────────
  routeRules: {
    "/**": {
      headers: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    },
  },

  // ─── Runtime Config ────────────────────────────────────────────────────────
  // Nilai publik yang aman diakses oleh frontend (client-side)
  runtimeConfig: {
    public: {
      // Base URL API backend
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        "http://localhost:3000/api/v1",
      // Base URL storage/media
      storageBase:
        process.env.NUXT_PUBLIC_STORAGE_BASE ||
        "http://localhost:3000/storage",
      // Google OAuth Client ID (Public identifier)
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
      googleRedirectUri: process.env.NUXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "",
      // Midtrans Snap (Sandbox: app.sandbox.midtrans.com | Prod: app.midtrans.com)
      midtransSnapUrl:
        process.env.NUXT_PUBLIC_MIDTRANS_SNAP_URL ||
        "https://app.sandbox.midtrans.com/snap/snap.js",
      midtransClientKey:
        process.env.NUXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
        "Mid-client-twV4rNnPglIA4-2a",
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
