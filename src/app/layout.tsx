import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Cantor — Chorale liturgique",
  description: "Plateforme de gestion de chants pour chorales liturgiques multilingues",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7F77DD",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
