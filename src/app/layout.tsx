import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { Providers } from "@/components/common/Providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Memories of Sivsha — A Cinematic Journey",
  description: "A private personalized 3D relationship story and birthday celebration.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#07070d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} bg-[#07050d] text-rose-100`}>
      <body className="bg-[#07050d] text-rose-100 min-h-[100dvh] overflow-x-hidden antialiased selection:bg-rose-500/30">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
