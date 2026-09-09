import path from "node:path";

const localOnlyAuthSecret = "cyber-store-local-only-change-this-secret";

function intFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: intFromEnv(process.env.DB_PORT, 3306),
    // Reuse the existing Laravel database by default.
    database: process.env.DB_DATABASE || "cyber_store_v1",
    user: process.env.DB_USERNAME || "root",
    password: process.env.DB_PASSWORD || "",
    connectionLimit: intFromEnv(process.env.DB_CONNECTION_LIMIT, 10),
  },
  appUrl: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  authSecret:
    process.env.AUTH_SECRET ||
    process.env.APP_KEY ||
    localOnlyAuthSecret,
  usingLocalAuthSecret:
    !process.env.AUTH_SECRET && !process.env.APP_KEY,
  apiEncryptionKey: process.env.API_ENCRYPTION_KEY || "",
  mediaRoot: path.resolve(
    /* turbopackIgnore: true */ process.cwd(),
    process.env.MEDIA_ROOT || "./public/storage",
  ),
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
    production: process.env.MIDTRANS_IS_PRODUCTION === "true",
  },
  rajaOngkir: {
    apiKey: process.env.RAJAONGKIR_API_KEY || "",
    baseUrl:
      process.env.RAJAONGKIR_BASE_URL ||
      "https://api.rajaongkir.com/starter",
  },
  googleClientIds: [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[],
  mail: {
    host: process.env.MAIL_HOST || "",
    port: intFromEnv(process.env.MAIL_PORT, 587),
    user: process.env.MAIL_USERNAME || "",
    password: process.env.MAIL_PASSWORD || "",
    fromAddress: process.env.MAIL_FROM_ADDRESS || "noreply@example.com",
    fromName: process.env.MAIL_FROM_NAME || "Cyber Store",
  },
};
