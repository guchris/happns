// Next Imports
import type { Metadata } from "next";

// Google Imports
import { Inter } from "next/font/google";

// Vercel Imports
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

// Shadcn Imports
import { Toaster } from "@/components/ui/toaster"

// Context Imports
import { AuthProvider } from "@/context/AuthContext";

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
    <AuthProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Analytics />
          <SpeedInsights />
          <Toaster />
        </body>
      </html>
    </AuthProvider>
  );
}
