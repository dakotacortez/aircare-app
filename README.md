# Air Care & Mobile Care Platform

> **Mission-critical medical operations platform for emergency medical services in the field**

When every second counts and lives are on the line, Air Care & Mobile Care (ACMC) clinicians need instant access to protocols, calculators, and reference data—whether they're 30,000 feet in the air or in the back of a ground ambulance. This platform is their digital command center.

Built on a modern stack of Next.js and Payload CMS, the ACMC platform delivers a complete medical operations ecosystem: from quick-reference cards that clinicians can jot notes on during patient care, to sophisticated ventilator and drug calculators, to a comprehensive clinical protocol library managed by medical directors and content teams. Everything is designed to work seamlessly across devices, offline-capable where it matters, and packaged as both a web app and native mobile application.

## What This Platform Does

### 🚁 In the Field: Real-Time Clinical Support

Picture a paramedic in a helicopter at 2 AM, treating a critical pediatric patient. They pull up the ACMC app on their tablet, run a quick weight-based drug calculation, tap "Save to Reference Card," and instantly have a timestamped record they can reference throughout the flight. When they hand off to the ER, they can export the entire reference card via SMS or print—no fumbling with paper forms in turbulence.

**Quick Reference Cards** are the digital notepad every clinician needs. Store calculator outputs, jot down timestamped notes, and keep everything locally on the device for 24 hours with automatic expiration. Export via copy/paste, print, email, or SMS. No server required, no PHI to worry about—just fast, offline-first documentation that works when connectivity doesn't.

**Medical Calculators** power clinical decision-making in seconds. The ventilator calculator helps set optimal respiratory parameters. The pediatric drug calculator eliminates mental math errors when dosing critical medications for children. Each calculator feeds results directly into reference cards, creating a seamless workflow from calculation to documentation.

### 🏥 Command Center: Clinical Content Management

Medical directors and content teams have a powerful authoring environment where they can draft, review, and publish clinical protocols. The platform organizes everything by certification level—Universal, BLS (Basic Life Support), ALS (Advanced Life Support), and CCT (Critical Care Transport)—ensuring clinicians only see protocols relevant to their training.

**Clinical Protocol Library** features rich-text editors with specialized callouts, certification-level indicators, and tabbed content sections. Protocols can be drafted, reordered, previewed, and published with on-demand cache revalidation so updates appear instantly in the field.

**Hospital & Base Management** gives operations teams a single source of truth for facility capabilities, contact information, accepted patients, and equipment inventories. Change requests flow through an approval workflow, and the audit log tracks every modification.

**Push Notifications** keep teams informed about critical updates—new protocols, system alerts, or operational changes—delivered via Firebase Cloud Messaging to native and web clients.

### 🔐 Security & Access Control

Not everyone needs to see everything. Field clinicians access published protocols and calculators. Content teams can draft and preview. Admins control user approvals, role assignments, and system settings. Role-based access rules enforce the principle of least privilege, and all users must be both active and approved before accessing clinical content.

### 📱 Native Mobile Experience

The platform isn't just responsive—it's native. Capacitor wraps the web app into an Android shell (with iOS support ready to go) that clinicians install on their tablets. The app points to the live production site, delivering web update speeds with native device capabilities like push notifications and geolocation.

### ⚡ Modern Architecture, Field-Ready Performance

Under the hood, this is Next.js 15 with the App Router, React 19, TypeScript, Tailwind CSS, and shadcn/ui components. Payload CMS 3.x powers the admin interface and API layer. Postgres handles persistence. The platform leverages Payload plugins for SEO, search, redirects, nested docs, and form building—plus custom hooks for sanitization, revalidation, and workflow automation.

Everything is designed for speed: on-demand revalidation keeps cached pages fresh, optimistic UI updates provide instant feedback, and local storage keeps critical features working offline.

## Tech Stack

**Frontend**
Next.js 15 (App Router) • React 19 • TypeScript • Tailwind CSS • shadcn/ui • React Hook Form • Framer Motion

**Backend & CMS**
Payload CMS 3.64 • Postgres • Lexical Rich Text Editor • GraphQL API

**Payload Plugins**
SEO • Search • Redirects • Nested Docs • Form Builder

**External Services**
Firebase Cloud Messaging (push notifications) • Resend (email delivery) • Google Maps / HERE (ETA calculations)

**Native Mobile**
Capacitor 7 • Android (iOS-ready)

**Developer Tools**
pnpm • Vitest • Playwright • ESLint • Prettier

## How It Works

### Quick Reference Cards: Your Digital Clipboard

Reference cards are accessed via a floating action button (FAB) that opens a drawer interface—but only on mobile and tablet devices where they're most useful. Behind the scenes, cards are stored client-side in `localStorage` under the `acmc-reference-cards` key with automatic 24-hour expiration. This design keeps Protected Health Information (PHI) local to the device and enables full offline functionality.

Clinicians can add timestamped free-text notes, save structured calculator outputs, and export/share entire cards via multiple channels—all without a single server request. The drawer UI (`src/components/ReferenceCard`) integrates globally in the frontend layout, making it available throughout the application.

### Calculator Suite: Precision Medicine at Your Fingertips

The calculator suite lives at `/calculators` and currently includes ventilator settings and pediatric drug dosing calculators. Each calculator captures structured inputs (patient weight, medication, target dose) and generates outputs that can be instantly saved to a reference card.

This architecture (`src/components/Calculators`) serves as the integration pattern for future calculators—IV drip rates, RSI protocols, burn surface area charts, and more. The pattern is extensible: build a calculator, wire it to the reference card system, and clinicians have instant access.

### Clinical Content: Structured, Searchable, Secure

The content model is built around Payload collections that reflect real-world EMS operations:

- **Protocols** are the heart of clinical care, featuring tabbed Lexical rich-text editors organized by certification level (Universal, BLS, ALS, CCT). Custom callout blocks highlight critical information, and sanitization hooks ensure clean, consistent output.
- **Hospitals & Networks** catalog receiving facilities with detailed capability matrices, contact information, and accepted patient types. Change requests flow through approval workflows tracked in the audit log.
- **Bases & Assets** help operations teams manage equipment inventories, vehicle assignments, and station locations.
- **Calculators** are content-managed entries that can be featured, categorized, and linked from protocols.

Global collections (`Header`, `Footer`, `SiteSettings`) control site-wide chrome and configuration, while Payload's draft/publish workflow ensures content goes live only when ready.

### Security Model: Role-Based, Status-Aware

Access control operates on two axes: **role** and **status**. Users are assigned roles (`field-crew`, `content-team`, `admin-team`) that determine what they can create and edit. But role alone isn't enough—users must also have `status === 'active'` and `approved === true` before accessing any clinical content.

Access helpers (`src/access`) like `isAdmin`, `isContentTeamOrAdmin`, and custom guards enforce these rules across collections and operations. Job endpoints add an extra layer, requiring either an authenticated admin session or a valid `CRON_SECRET` bearer token for automated tasks.

### Offline-First, Native-Ready

The native shell is a Capacitor project (`capacitor.config.ts`) that wraps the web app and points to the production URL (`https://acmc.app`) with SSL enforcement. This hybrid approach delivers the best of both worlds: web-speed updates without app store delays, plus native capabilities like push notifications and geolocation.

Quick reference cards use local storage exclusively, so they work even when the device is offline—critical for air ambulances that routinely lose connectivity. For deeper technical specs and implementation details, see `docs/REFERENCE_CARD_SYSTEM.md`.

## Repository Structure

```
src/
├── app/
│   ├── (frontend)/          # Public-facing app, calculators, reference cards
│   └── (payload)/           # Admin UI customizations
├── collections/             # Payload collections: Protocols, Hospitals, Users, etc.
├── components/
│   ├── ReferenceCard/       # FAB, drawer, export modals, localStorage hooks
│   └── Calculators/         # Ventilator, pediatric drug calculators
├── hooks/                   # useReferenceCard, useDeviceType, shared logic
├── lexical/                 # Custom Lexical editor features (callouts, certification levels)
├── access/                  # Role-based access control helpers
├── utilities/               # Email, ETA providers, sanitization, revalidation
└── migrations/              # Postgres schema migrations

android/                     # Capacitor native Android project
docs/                        # Technical specs and implementation guides
```

## Getting Started

### Prerequisites

- **Node.js** 20.9+ (or 18.20.2 for CI parity)
- **pnpm** 9+
- **Postgres** database (local Docker, cloud instance, or Supabase)

### Environment Setup

Copy `.env.example` to `.env` and configure at minimum:

```bash
# Required
PAYLOAD_SECRET=your-secret-key-here
DATABASE_URI=postgresql://user:pass@localhost:5432/acmc
NEXT_PUBLIC_SERVER_URL=http://localhost:3000

# Optional but recommended
CRON_SECRET=your-cron-secret
RESEND_API_KEY=re_your_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

See `.env.example` for the complete list of configuration options including Firebase (push notifications), email settings, and ETA provider configuration.

### Local Development

```bash
pnpm install
pnpm dev
```

The dev server starts at `http://localhost:3000` with both the Payload admin (`/admin`) and Next.js frontend. On first run, you'll be prompted to create an admin account—make sure your Postgres database is running and accessible.

### Development Commands

```bash
pnpm dev              # Start development server
pnpm build            # Production build
pnpm start            # Serve production build
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm test             # Run all tests (integration + e2e)
pnpm test:int         # Vitest integration tests
pnpm test:e2e         # Playwright end-to-end tests
pnpm payload migrate  # Run database migrations
```

### Production Deployment

```bash
# Run migrations first
pnpm payload migrate

# Build the application
pnpm build

# Start production server
pnpm start
```

The platform is deployed at `https://acmc.app` and served via PM2 process manager. See `ecosystem.config.js` for production configuration.

## Workflows

### For Clinicians: Reference Cards in Action

A field medic opens the app on their tablet, navigates to `/calculators`, and runs a pediatric drug calculation. They tap **Save to Reference Card**, and the calculation appears in the drawer accessible via the green floating action button.

During patient care, they add timestamped notes by tapping the "+" button in the drawer. When handing off to the receiving facility, they export the entire reference card via SMS to the ER doc or print it for the paper chart. After 24 hours, the card auto-expires and all data is cleared from local storage.

**Key Features:**
- Fully offline—works without connectivity
- PHI stays on device, never hits server
- Multiple export options: copy, print, email, SMS
- Automatic 24-hour expiration

See `docs/REFERENCE_CARD_SYSTEM.md` for complete UX specifications.

### For Content Teams: Publishing Clinical Protocols

Medical directors and content specialists log into `/admin` with their content-team credentials. They can draft new protocols or update existing ones using the rich Lexical editor with custom callouts and certification-level indicators.

Protocols support tabbed content (Universal, BLS, ALS, CCT), reordering via drag-and-drop, and live preview before publishing. When a protocol is published, revalidation hooks trigger automatically to clear Next.js caches and push updates to the field instantly.

Collections like Hospitals, Bases, and Assets follow the same draft/publish workflow. Change requests go through approval processes, and every modification is logged in the audit trail.

**Key Features:**
- Draft/publish workflow with live preview
- Rich-text editor with medical-specific features
- Instant cache revalidation on publish
- Full audit logging

### For Developers: Native Mobile Builds

The native Android app is a Capacitor wrapper around the web application:

```bash
# Sync web assets to native project
npx cap sync android

# Open in Android Studio
npx cap open android
```

The Capacitor config (`capacitor.config.ts`) points to `https://acmc.app` in production. For development or staging builds, update the `server.url` property to point at your test environment.

iOS support is ready—just add the iOS platform and sync:

```bash
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Documentation & Resources

**Technical Specifications**
- `docs/REFERENCE_CARD_SYSTEM.md` – Complete functional and technical specification for the reference card system
- `REFERENCE_CARD_IMPLEMENTATION.md` – Implementation summary and deployment notes
- `FIREBASE_SETUP.md` – Firebase push notification configuration guide
- `SECURITY_AUDIT_REPORT.md` – Security audit findings and recommendations

**Testing & Development**
- `src/components/ReferenceCard/__tests__/` – Reference card test suite
- `playwright.config.ts` – E2E test configuration
- `vitest.config.mts` – Integration test setup

## Key Features at a Glance

✅ **Quick reference cards** with offline storage and multi-channel export
✅ **Medical calculators** (ventilator, pediatric drugs) with instant save-to-card
✅ **Clinical protocol library** organized by certification level (BLS/ALS/CCT)
✅ **Hospital & base management** with capability matrices and change workflows
✅ **Push notifications** via Firebase Cloud Messaging
✅ **Role-based access control** with status-aware permissions
✅ **Native mobile apps** (Android deployed, iOS-ready)
✅ **Real-time ETA calculations** with Google Maps / HERE fallback
✅ **Draft/publish workflows** with instant cache revalidation
✅ **Full audit logging** for compliance and accountability

## Contributing & Support

This is a production platform for Air Care & Mobile Care emergency medical services. For questions, bug reports, or feature requests, file an issue in this repository or reach out to the engineering team.

For Payload CMS questions, consult the [Payload documentation](https://payloadcms.com/docs) or join the [Payload Discord](https://discord.com/invite/payload).

---

**Built with ❤️ for the clinicians who save lives every day.**
