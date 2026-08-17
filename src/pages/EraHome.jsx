import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  MessageSquare,
  Workflow,
  Users,
  Calendar,
  CreditCard,
  LayoutDashboard,
  Globe,
  UserCheck,
  Wrench,
  Zap,
} from "lucide-react";

const BASIC_FEATURES = [
  { icon: Globe, label: "Branded website" },
  { icon: MessageSquare, label: "AI chat widget" },
  { icon: Workflow, label: "Core engines — communication rules, job workflow, CRM" },
  { icon: Calendar, label: "Booking & scheduling" },
  { icon: CreditCard, label: "Payments" },
  { icon: LayoutDashboard, label: "Admin dashboard" },
  { icon: Globe, label: "Self-serve domain, email & phone" },
];

const FOUNDATION_EXTRA = [
  { icon: UserCheck, label: "Member portal" },
  { icon: Wrench, label: "Specialist portal" },
  { icon: Zap, label: "Simple automations" },
];

const COMPARISON_ROWS = [
  { feature: "Branded website", basic: true, foundation: true },
  { feature: "AI chat widget", basic: true, foundation: true },
  { feature: "Core engines (communication, workflow, CRM)", basic: true, foundation: true },
  { feature: "Booking & scheduling", basic: true, foundation: true },
  { feature: "Payments", basic: true, foundation: true },
  { feature: "Admin dashboard", basic: true, foundation: true },
  { feature: "Self-serve domain, email & phone", basic: true, foundation: true },
  { feature: "Member portal", basic: false, foundation: true },
  { feature: "Specialist portal", basic: false, foundation: true },
  { feature: "Simple automations", basic: false, foundation: true },
];

export default function EraHome() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            The operating system for<br className="hidden md:block" /> service-based businesses
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            ERA Core is a modular, event-driven platform that runs your entire service business —
            centralized communication rules, job-centric workflows, and a CRM-centric architecture.
          </p>
          <Link to="/era-register">
            <Button size="lg" className="h-12 px-8 text-base">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* What You're Getting */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">What you're getting</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
            One platform that connects every part of your service business — from first customer
            contact to job completion, billing, and beyond.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Communication rules engine</h3>
              <p className="text-sm text-muted-foreground">
                Centralized, configurable rules for every customer interaction across SMS, email, and chat.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Workflow className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Job-centric workflows</h3>
              <p className="text-sm text-muted-foreground">
                Every service flows through a single Job entity — scheduling, specialists, photos,
                invoices, and journey all linked.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">CRM-centric architecture</h3>
              <p className="text-sm text-muted-foreground">
                A single customer record drives every interaction, with lifetime value, consent, and
                journey history built in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-center mb-16">
            Start with a one-time setup fee, then a flat monthly rate. No per-seat charges, no surprises.
          </p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Basic */}
            <div className="border border-border rounded-xl p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Basic</h3>
              <p className="text-muted-foreground text-sm mb-6">Everything you need to launch your service business.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$150</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-sm text-muted-foreground mt-1">+ $500 one-time setup fee</p>
              </div>
              <ul className="space-y-2 mb-8 text-sm flex-1">
                {BASIC_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link to="/era-register">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Foundation */}
            <div className="border border-primary rounded-xl p-8 flex flex-col relative bg-primary/5">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Most popular
              </span>
              <h3 className="text-xl font-bold mb-2">Foundation</h3>
              <p className="text-muted-foreground text-sm mb-6">Advanced tools to grow and scale.</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">$400</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-sm text-muted-foreground mt-1">+ $900 one-time setup fee</p>
              </div>
              <ul className="space-y-2 mb-8 text-sm flex-1">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Everything in Basic
                </li>
                {FOUNDATION_EXTRA.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    {f.label}
                  </li>
                ))}
              </ul>
              <Link to="/era-register">
                <Button className="w-full">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Compare plans</h2>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold w-28">Basic</th>
                  <th className="text-center p-4 font-semibold w-28">Foundation</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-4 text-sm">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.basic ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.foundation ? (
                        <Check className="w-4 h-4 text-primary mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to launch your business?</h2>
          <p className="text-muted-foreground mb-8">Create your ERA account and get started in minutes.</p>
          <Link to="/era-register">
            <Button size="lg" className="h-12 px-8 text-base">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}