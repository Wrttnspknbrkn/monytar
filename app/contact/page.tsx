"use client"

import { useState } from "react"
import { Mail, MapPin, Phone, Send, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingFooter } from "@/components/landing/landing-footer"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
    toast.success("Message sent successfully!")
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Contact</p>
          <h1 className="font-heading text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-balance">Get in touch</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about Monytar? Our team is here to help you find the right solution for your organization.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {[
              { icon: Mail, label: "Email", value: "hello@monytar.com", href: "mailto:hello@monytar.com" },
              { icon: Phone, label: "Phone", value: "+233 20 839 5962", href: "tel:+233208395962" },
              { icon: MapPin, label: "Office", value: "Accra, Ghana", href: undefined },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/5 border border-primary/10 shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
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

            <div className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="font-heading font-bold text-sm mb-2">Enterprise Sales</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Looking for custom pricing or enterprise features? Our sales team will work with you to find the perfect plan.
              </p>
              <a href="mailto:sales@monytar.com" className="text-sm text-primary font-medium mt-2 inline-block hover:underline">
                sales@monytar.com
              </a>
            </div>
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
                  <Label className="text-[13px] font-medium">Work Email</Label>
                  <Input required type="email" placeholder="john@company.com" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">Company</Label>
                  <Input placeholder="Your Company" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-[13px] font-medium">How can we help?</Label>
                  <Textarea required placeholder="Tell us about your expense management needs..." className="min-h-[120px] resize-none" />
                </div>
                <Button type="submit" className="w-full font-semibold shadow-sm shadow-primary/20">
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  )
}
