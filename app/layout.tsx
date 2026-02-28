import React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { StoreProvider } from "@/lib/store"

import "./globals.css"

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
    default: "SpendWell - Modern Expense Management Platform",
    template: "%s | SpendWell",
  },
  description:
    "SpendWell is the modern way to manage business expenses. Streamline requests, automate approvals, track budgets, and gain real-time financial insights for your organization.",
  keywords: [
    "expense management",
    "approval workflow",
    "budget tracking",
    "vendor management",
    "financial reporting",
    "business expenses",
    "spend management",
  ],
  authors: [{ name: "GydGen" }],
  creator: "GydGen",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://spendwell.io"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "SpendWell",
    title: "SpendWell - Modern Expense Management Platform",
    description:
      "Streamline expense requests, automate approvals, and gain real-time financial insights for your organization.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWell - Modern Expense Management Platform",
    description:
      "Streamline expense requests, automate approvals, and gain real-time financial insights.",
  },
  robots: {
    index: true,
    follow: true,
  },
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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <StoreProvider>
            {children}
            <Toaster position="bottom-right" richColors closeButton />
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
