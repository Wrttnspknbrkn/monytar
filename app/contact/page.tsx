"use client"

import { useState } from "react"
import { Mail, MapPin, Phone, Send, CheckCircle2, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"
import { Reveal } from "@/components/landing/reveal"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    toast.success("Message sent successfully!")
  }

  return (
    <div className="min-h-screen bg-white">
      <LandingHeader />

      {/* HERO */}
      <section className="relative pt-28 pb-16 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_60%_-10%,rgba(99,102,241,0.3),transparent)]" />
        <div className="absolute inset-0 bg-[url('/images/dot-grid.svg')] opacity-[0.06]" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm text-primary/90 mb-8 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            We usually reply within 24 hours
            <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-[1.05] tracking-tight mb-6">
            Get in{" "}
            <span className="bg-gradient-to-r from-indigo-300 via-primary to-cyan-400 bg-clip-text text-transparent">
              touch
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Have questions about Monytar? Our team is here to help you find the right solution for your
            organization.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="py-20 md:py-24 px-4 sm:px-6 bg-slate-50">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <Reveal className="lg:col-span-2 flex flex-col gap-4">
            {[
              { icon: Mail, label: "Email", value: "hello@monytar.com", href: "mailto:hello@monytar.com" },
              { icon: Phone, label: "Phone", value: "+233 20 839 5962", href: "tel:+233208395962" },
              { icon: MapPin, label: "Office", value: "Accra, Ghana", href: undefined },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-primary/20 hover:shadow-sm transition-all duration-300"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      {item.label}
                    </p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium text-slate-700 hover:text-primary transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-slate-700 whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="p-5 rounded-2xl border border-slate-100 bg-white">
              <h3 className="font-display font-bold text-sm text-slate-900 mb-2">Enterprise Sales</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Looking for custom pricing or enterprise features? Our sales team will work with you to
                find the perfect plan.
              </p>
              <a
                href="mailto:sales@monytar.com"
                className="text-sm text-primary font-semibold mt-2 inline-block hover:underline underline-offset-2"
              >
                sales@monytar.com
              </a>
            </div>
          </Reveal>

          {/* Contact Form */}
          <Reveal delay={120} className="lg:col-span-3">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-slate-100 bg-white">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Message Sent</h3>
                <p className="text-slate-500 text-sm mb-6">
                  Thank you for reaching out. We will get back to you within 24 hours.
                </p>
                <Button variant="outline" className="bg-transparent" onClick={() => setSubmitted(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[13px] font-medium text-slate-700">First Name</Label>
                    <Input required placeholder="John" className="h-11" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[13px] font-medium text-slate-700">Last Name</Label>
                    <Input required placeholder="Doe" className="h-11" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium text-slate-700">Work Email</Label>
                  <Input required type="email" placeholder="john@company.com" className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium text-slate-700">Company</Label>
                  <Input placeholder="Your Company" className="h-11" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium text-slate-700">How can we help?</Label>
                  <Textarea
                    required
                    placeholder="Tell us about your expense management needs..."
                    className="min-h-[120px] resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-12 font-semibold shadow-sm shadow-primary/20">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            )}
          </Reveal>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
