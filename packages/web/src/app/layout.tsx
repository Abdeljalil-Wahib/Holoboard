// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Orbitron } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Holoboard",
  description: "A real-time collaborative whiteboard built with Next.js",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${orbitron.className} bg-background text-foreground`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
