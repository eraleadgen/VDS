# VDS Mobile

**A high-end automotive detailing concierge platform** — the client-facing website, booking system, and operations backbone for Valet Detailing Service LLC, a premium mobile detailing business serving luxury and performance vehicles across Metro Atlanta.

Live site: **https://vdsmobile.com**

---

## What this project is

VDS Mobile is a full-stack web application built on the [Base44](https://base44.com) platform. It is not a static marketing site — it is the complete operational system running the business:

- **Customer-facing website** — hero, services, pricing, gallery, FAQ, membership, booking flow
- **Dynamic pricing engine** — vehicle classification, condition multipliers, paint-protection discounts, add-ons
- **VDS Gold membership** — recurring Stripe subscriptions with per-vehicle pricing groups
- **Booking & scheduling** — Google Calendar integration, availability checks, auto-assignment
- **Specialist (contractor) portal** — job board, availability editor, completion workflow, photo upload
- **Partner Network** — referral attribution, incentive tracking, vanity referral codes
- **Admin dashboard** — jobs, quotes, invoices, customers, vehicles, partners, contractors, analytics
- **AI concierge ("Valerie")** — SMS and web chat assistant for quotes and booking
- **Multi-tenant foundation** — the ERA Systems architecture underpins this app, supporting future white-label tenants

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, shadcn/ui, lucide-react, framer-motion, recharts, react-leaflet
- **Backend:** Base44 serverless functions (Deno/TypeScript), Base44 managed database (entities)
- **Integrations:** Stripe (live payments), Twilio (SMS), Resend (email), OpenAI (Valerie), Google Calendar, Google Places
- **Design system:** Custom dark theme — obsidian + gold aesthetic with animated gold particle effects and shimmer text

## Project structure

```
src/
├── pages/              # Route-level pages (Home, BookAppointment, AdminDashboard, etc.)
├── components/
│   ├── vds/            # Brand components (Navbar, Footer, GoldParticles, RouteSeo)
│   ├── booking/        # Quote calculation and booking flow components
│   ├── admin/          # Admin dashboard tabs
│   ├── member/         # Member portal (dashboard, vehicle garage)
│   ├── contractor/     # Specialist portal components
│   ├── partner/        # Partner Network portal
│   ├── era-admin/      # ERA Systems staff console
│   ├── marketing/      # ERA Systems marketing site components
│   ├── onboarding/     # Multi-step tenant onboarding wizard
│   └── ui/             # shadcn/ui primitives
└── lib/                # Contexts, hooks, utilities, pricing logic

base44/
├── entities/           # Database schemas (Customer, Job, Quote, Invoice, etc.)
├── functions/          # Serverless backend functions (Stripe, Twilio, scheduling, AI)
├── shared/             # Shared backend modules (tenant context, pricing, auth)
└── workflows/          # Scheduled and event-triggered automations
```

## Key architectural concepts

- **BusinessConfig entity** — single source of truth for all business data: pricing, services, hours, branding, SEO, FAQ. The entire site is config-driven, not hardcoded.
- **Multi-tenant ready** — every operational entity carries a `business_id` scope with row-level security, enabling future white-label deployments.
- **Event-driven** — a `SystemEventLog` audit trail and `CustomerJourney` timeline capture every meaningful interaction.
- **Communication Rules Engine** — centralized consent and channel-tier logic governs every SMS and email.

## Running locally

This app depends on the Base44 backend (database, auth, serverless functions, integrations). The source code here is the frontend plus backend function definitions; a connected Base44 workspace provides the runtime.

### Prerequisites

1. Clone the repository
2. `npm install`
3. Create a `.env.local` file:

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url
```

4. `npm run dev`

> **Note:** Environment variables and integration secrets (Stripe, Twilio, Resend, Google, OpenAI) are managed in the Base44 dashboard's Secrets vault — they are never committed to this repository.

## About this repository

This repo is published publicly as a **portfolio showcase** of the engineering work behind VDS Mobile. The live application processes real payments and handles live customer data; those credentials and any sensitive business data live in the Base44 backend, not in this codebase.

Built with [Base44](https://base44.com).