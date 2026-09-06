"use client"

import React from "react"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { MobileNav } from "@/components/layout/mobile-nav"
import { DemoBanner } from "@/components/layout/demo-banner"
import { useData } from "@/lib/providers"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isDemo } = useData()

  return (
    <div className="dashboard-layout flex min-h-screen overflow-x-hidden bg-background">
      <Sidebar />
      <div className="dashboard-main flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {isDemo && <DemoBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div className="dashboard-page p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full animate-fade-in">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  )
}