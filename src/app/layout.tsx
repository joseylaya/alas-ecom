import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getCatalog } from "@/features/catalog/catalog.service";
import { ChatWidget } from "@/components/support/chat-widget";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = { title: "ALAS — Clothing", description: "ALAS clothing, made for the everyday." };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const products = await getCatalog();
  return <html lang="en" className={`${manrope.variable} ${inter.variable}`}><body><Header products={products} />{children}<Footer /><ChatWidget /></body></html>;
}
