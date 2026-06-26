import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Thikana — AI-Powered Rental Marketplace Bangladesh",
  description:
    "Find verified, affordable rental accommodation in Dhaka with AI-powered search, bilingual listings, and smart financial tools for students and families.",
  keywords: ["rental", "Bangladesh", "Dhaka", "student housing", "flat rent", "বাড়ি ভাড়া"],
  openGraph: {
    title: "Thikana — Find Your Home in Dhaka",
    description: "AI-native bilingual rental marketplace for Bangladesh students and families.",
    type: "website",
    locale: "en_BD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable}`}>
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
