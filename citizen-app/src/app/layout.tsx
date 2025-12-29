import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "@/components/Providers";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ENVIROLINK - Report Waste Issues | Clean Cities Together",
  description: "Turn every citizen into a cleanliness sensor. Report waste hotspots, track cleanup progress, and help make your city cleaner.",
  keywords: ["waste management", "civic tech", "smart city", "environmental reporting", "citizen engagement"],
  authors: [{ name: "ENVIROLINK" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "ENVIROLINK - Report Waste Issues",
    description: "Turn every citizen into a cleanliness sensor. Report waste and track cleanup in your city.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "ENVIROLINK",
    description: "Report waste issues and make your city cleaner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body
        className={`${nunito.variable} font-sans antialiased bg-white`}
        suppressHydrationWarning
      >
        <Providers>
          <div className="min-h-screen flex flex-col bg-white">
            <Navbar />
            <main className="flex-1 bg-white">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
