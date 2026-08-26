import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const metadata: Metadata = {
  title: "VedaAI — Assessment Extraction & Answer Mapping",
  description:
    "Upload a question paper and a student's answer sheet to extract questions, map answers, and highlight exactly where each answer is."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gradient-to-b from-veda-bgTop to-veda-bgBottom text-veda-ink antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
