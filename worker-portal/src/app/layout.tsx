import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BootAppWrapper from "@/components/BootAppWrapper";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  title: "ENVIROLINK - Worker Portal",
  description: "Worker management portal for sanitation workers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased bg-gray-50`}>
        <BootAppWrapper>
          {children}
        </BootAppWrapper>
      </body>
    </html>
  );
}

