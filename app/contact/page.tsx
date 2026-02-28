"use client"

import Link from "next/link"
import { useState } from "react"
import { Wallet, ArrowRight, Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    toast.success("Message sent successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link href="/" className="flex items-center group">
            <Logo size="md" />
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Features</Link>
            <Link href="/#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">Pricing</Link>
            <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200">About</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sm font-medium">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="text-sm font-medium shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30 transition-all">
                Get Started <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Contact</p>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-balance">Get in touch</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Have questions about SpendWell? We would love to hear from you.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {[
              { icon: Mail, label: "Email", value: "hello@spendwell.io", href: "mailto:hello@spendwell.io" },
              { icon: Phone, label: "Phone", value: "+233 20 839 5962", href: "tel:+233208395962" },
              { icon: MapPin, label: "Office", value: "Accra, Ghana", href: undefined },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 shrink-0">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-medium hover:text-primary transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-sm font-medium whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/30 mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-2">Message Sent</h3>
                <p className="text-muted-foreground text-sm mb-6">Thank you for reaching out. We will get back to you within 24 hours.</p>
                <Button variant="outline" className="bg-transparent" onClick={() => setSubmitted(false)}>Send Another Message</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 rounded-2xl border border-border bg-card flex flex-col gap-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[13px] font-medium">First Name</Label>
                    <Input required placeholder="John" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[13px] font-medium">Last Name</Label>
                    <Input required placeholder="Doe" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Email</Label>
                  <Input required type="email" placeholder="john@company.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Company</Label>
                  <Input placeholder="Acme Corp" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Message</Label>
                  <Textarea required placeholder="Tell us how we can help..." className="min-h-[120px] resize-none" />
                </div>
                <Button type="submit" className="w-full font-semibold shadow-sm shadow-primary/20">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <div className="mb-4">
                <Logo size="md" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Modern expense management for teams that move fast.</p>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Product</h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "Features", href: "#features" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Integrations", href: "#integrations" },
                  { label: "Changelog", href: "#changelog" },
                ].map((item) => (
                  <li key={item.label}><a href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Company</h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "About", href: "/about" },
                  { label: "Contact", href: "/contact" },
                ].map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5">
                {[
                  { label: "Privacy", href: "/privacy" },
                  { label: "Terms", href: "/terms" },
                  { label: "Security", href: "/security" },
                  { label: "GDPR", href: "/gdpr" },
                ].map((item) => (
                  <li key={item.label}><Link href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; 2026 SpendWell. All rights reserved.</p>
            <p className="text-sm text-muted-foreground">Developed by <a href="https://www.gydgen.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:text-primary transition-colors">GydGen</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
