import type { Metadata } from "next";
import "@/app/globals.css";
import { ThemeScript } from "@/components/theme-script";

export const metadata: Metadata = {
  title: { default: "Cyber Store", template: "%s | Cyber Store" },
  description: "Panel administrasi dan REST API Cyber Store berbasis Next.js.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><head><ThemeScript /></head><body>{children}</body></html>;
}
