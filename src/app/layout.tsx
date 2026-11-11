import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Imprimatur: a spending licence for AI agents", template: "%s | Imprimatur" },
  description:
    "Imprimatur examines an AI agent before it is allowed to spend, measures how often it loses money, and underwrites the Kite Passport limit it has earned.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#08080b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
