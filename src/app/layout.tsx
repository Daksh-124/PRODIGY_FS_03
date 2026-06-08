import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import ClientWrapper from "@/components/ClientWrapper";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "MoonzThrift // Dark Celestial Luxury Thrift E-Commerce",
  description: "Curated vintage streetwear, Y2K apparel, gothic modern silhouettes, and rare streetwear couture. Mystical minimalism meets high-end Gen-Z thrift culture.",
  keywords: "thrift store, vintage streetwear, luxury clothing, gothic fashion, y2k aesthetic, moonzthrift, curated thrift, stockx, grailed, represent",
  authors: [{ name: "MoonzThrift Team" }],
  openGraph: {
    title: "MoonzThrift // Dark Celestial Luxury Thrift E-Commerce",
    description: "Curated vintage streetwear, Y2K apparel, gothic modern silhouettes, and rare streetwear couture.",
    type: "website",
    locale: "en_US",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0c0c0c] text-[#F0EFE7]">
        <AuthProvider>
          <StoreProvider>
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
