import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeScript } from "@/components/theme-script";
import { rows } from "@/lib/db";
import { publicUrl } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settingsRows = await rows<RowDataPacket & { key: string; value: string | null }>(
      "SELECT `key`, value FROM settings WHERE `key` IN ('store_name', 'store_logo')"
    );
    const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
    const storeName = settingsMap.store_name || "UBSI Cyber Store";
    const logoUrl = publicUrl(settingsMap.store_logo) || "/logo-cyberstore.jpg";

    return {
      title: { default: `${storeName} Admin`, template: `%s | ${storeName} Admin` },
      description: `Panel administrasi dan REST API ${storeName} berbasis Next.js.`,
      icons: {
        icon: [{ url: logoUrl }],
        shortcut: [logoUrl],
        apple: [logoUrl],
      },
    };
  } catch {
    return {
      title: { default: "Cyber Store Admin", template: "%s | Cyber Store Admin" },
      description: "Panel administrasi dan REST API Cyber Store berbasis Next.js.",
      icons: {
        icon: [{ url: "/logo-cyberstore.jpg" }],
      },
    };
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let logoUrl = "/logo-cyberstore.jpg";
  try {
    const settingsRows = await rows<RowDataPacket & { key: string; value: string | null }>(
      "SELECT `key`, value FROM settings WHERE `key` = 'store_logo' LIMIT 1"
    );
    if (settingsRows.length && settingsRows[0].value) {
      logoUrl = publicUrl(settingsRows[0].value) || logoUrl;
    }
  } catch {
    // fallback
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="icon" href={logoUrl} />
        <link rel="shortcut icon" href={logoUrl} />
        <link rel="apple-touch-icon" href={logoUrl} />
      </head>
      <body>{children}</body>
    </html>
  );
}
