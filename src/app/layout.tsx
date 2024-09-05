// Next Imports
import type { Metadata } from "next";

// Google Imports
import { Inter } from "next/font/google";

// React Imports
import { Analytics } from "@vercel/analytics/react"

// Shadcn Imports
import { Toaster } from "@/components/ui/toaster"

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "happns",
  description: "happenings in your city",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  );
}
