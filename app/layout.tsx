import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { Providers } from "@/lib/providers"
import { SITE_NAME, SITE_URL } from "@/lib/seo"

import "./globals.css"

// Cal Sans display font for premium headings
const calSans = localFont({
  src: "../public/fonts/CalSans-SemiBold.woff2",
  variable: "--font-display",
  display: "swap",
  preload: true,
})

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Monytar - Modern Expense Management Platform",
    template: "%s | Monytar",
  },
  description:
    "Monytar is the modern way to manage business expenses. Streamline requests, automate approvals, track budgets, and gain real-time financial insights for your organization.",
  keywords: [
    "expense management",
    "approval workflow",
    "budget tracking",
    "vendor management",
    "financial reporting",
    "business expenses",
    "spend management",
    "monytar",
  ],
  authors: [{ name: "GydGen" }],
  creator: "GydGen",
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Monytar",
    title: "Monytar - Modern Expense Management Platform",
    description:
      "Streamline expense requests, automate approvals, and gain real-time financial insights for your organization.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Monytar - Modern Expense Management Platform",
    description:
      "Streamline expense requests, automate approvals, and gain real-time financial insights.",
  },
  robots: {
    index: true,
    follow: true,
  },
  // Google Search Console "HTML tag" verification. Not needed if you verify the domain via DNS.
  ...(process.env.GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } } : {}),
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcfd" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${calSans.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
