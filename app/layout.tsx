import React from "react"
import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { StoreProvider } from "@/lib/store"

import "./globals.css"

const _plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

const _inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "SpendFlow - Modern Expense Management",
    template: "%s | SpendFlow",
  },
  description:
    "The modern way to manage expenses. Streamline requests, automate approvals, and gain real-time financial insights.",
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
      <body className="font-sans antialiased">
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
