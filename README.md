# ACMC Reference Card Platform

ACMC now runs a purpose-built medical operations portal that sits on top of Payload CMS and Next.js. The repo powers the public site, the authenticated clinician workspace, the offline-friendly calculator suite, and the native shell (via Capacitor) that we ship to the field. This README describes the product we actually run—not the stock Payload template it started from.

## What the App Delivers

- **Quick Reference Cards:** Mobile/tablet-only drawer that stores calculator outputs and free-form notes for 24 hours in `localStorage`, complete with export flows (copy, print, email, SMS).
- **Medical Calculators:** Ventilator and pediatric drug calculators (with hooks to add more) that can hand results directly to the reference-card system.
- **Clinical Content Library:** Draftable, orderable protocol collection with service-line tabs (Universal, BLS, ALS, CCT), hospital asset catalogs, bases, calculators, and more.
- **Role-aware Access Control:** Users must be active and approved; content-team and admin-team roles unlock authoring tools, while field crews only see published material.
- **Next.js Frontend + Payload Backend:** Shared repo using the App Router, Tailwind, shadcn/ui, Payload SEO/Search/Redirect plugins, and on-demand revalidation.
- **Native Packaging:** The `android/` folder plus `capacitor.config.ts` provide a wrapper that points the native shell to the live deployment at `https://ucair.care`.

## Tech Stack at a Glance

- **Frontend:** Next.js 15 App Router, React 19, TypeScript, TailwindCSS, shadcn/ui, React Hook Form.
- **CMS & API:** Payload 3.64 with Postgres adapter, Lexical-based editors, Payload plugins (SEO, Search, Redirects, Nested Docs, Form Builder).
- **Data:** Postgres (primary), `localStorage` for quick cards, Media uploads via Payload.
- **Tooling:** pnpm, Vitest, Playwright, ESLint, Prettier.
- **Native shell:** Capacitor 7 with Android project checked in.

## Core Feature Details

### Quick Reference Cards
- Mobile/tablet-gated via `useDeviceType`.
- Stored entirely client-side under the `acmc-reference-cards` key with 24-hour auto-expiration.
- FAB + drawer UI (`src/components/ReferenceCard`) integrated globally in `src/app/(frontend)/layout.tsx`.
- Users can add timestamped notes, save calculator outputs, and export/share cards without touching the server.

### Calculator Suite
- Located at `/calculators` and built from `src/components/Calculators`.
- Demonstrates how to capture structured inputs/outputs and pass them to the reference-card modals.
- Acts as the integration pattern for future calculators (IV drips, RSI, burn charts, etc.).

### Clinical Content Model
- Collections include `Protocols`, `Hospitals`, `HospitalNetworks`, `HospitalCapabilities`, `Bases`, `Assets`, and `Calculators`, each with tailored access rules in `src/collections`.
- Protocols feature tabbed Lexical editors, certification-level callouts, sanitization hooks, and approval workflows.
- Globals (`Header`, `Footer`, `SiteSettings`) power site chrome and system-wide settings.

### Security & Roles
- Roles live in `src/access` with helpers such as `isAdmin`, `isContentTeamOrAdmin`, and status-aware guards.
- End users must be `status === 'active'` and `approved` before they can read published protocols.
- Jobs endpoints require either an authenticated admin or a valid `CRON_SECRET` bearer.

### Native & Offline Story
- Capacitor config (`capacitor.config.ts`) points the Android wrapper at the production URL with SSL enforced.
- Local-only storage avoids PHI drift and works fully offline; documentation lives in `docs/REFERENCE_CARD_SYSTEM.md`.

## Repository Tour

- `src/app/(frontend)` – customer-facing application, including the calculator route, reference-card drawer, and global styles.
- `src/app/(payload)` – admin UI customizations plus shared styles.
- `src/components/ReferenceCard` – drawers, modals, export helpers, and hooks for the card system.
- `src/hooks` – `useReferenceCard`, `useDeviceType`, and other shared logic.
- `src/collections` – Payload collection definitions for protocols, hospitals, assets, calculators, etc.
- `src/migrations` – SQL migrations tracked alongside the Postgres adapter.
- `android/` – native Android project produced by Capacitor (kept in sync with `npx cap sync android`).
- `docs/REFERENCE_CARD_SYSTEM.md` – full functional/technical spec for the quick-reference feature.

## Getting Started

### Prerequisites

- Node.js 20.9+ (or 18.20.2 for parity with CI)
- pnpm 9+
- Postgres database (local Docker, cloud instance, or Supabase)
- `PAYLOAD_SECRET`, `DATABASE_URI`, and `NEXT_PUBLIC_SERVER_URL` environment variables
- Optional: `CRON_SECRET`, `SMTP_*`, `PAYLOAD_PUBLIC_SERVER_URL`, storage credentials, etc.

### Environment Variables

Create an `.env` file in the project root. At minimum you will need:

```
PAYLOAD_SECRET=dev-secret
DATABASE_URI=postgres://user:pass@localhost:5432/acmc
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
CRON_SECRET=optional-cron-token
```

Add any other keys referenced in `src/payload.config.ts`, `ecosystem.config.cjs`, or deployment targets.

### Local Development

```bash
pnpm install
pnpm dev
```

The dev server runs both the Payload admin and the Next.js frontend at `http://localhost:3000`. The first browser visit will prompt you to create an admin account; ensure your Postgres instance is reachable before you start.

### Running Tests & Quality Gates

- `pnpm lint` – Next.js ESLint rules
- `pnpm test:int` – Vitest integration suite (runs against mocked Payload)
- `pnpm test:e2e` – Playwright (requires the dev server)
- `pnpm test` – runs both integration and e2e suites

### Production Build & Serve

```bash
pnpm build
pnpm payload migrate   # ensure migrations run before deploying
pnpm start             # serves the built Next.js app
```

### Docker / Containers

A legacy `docker-compose.yml` still exists but targets Mongo. If you need containerized development, create an updated compose file with Postgres or point Docker to an external Postgres service before using it.

## Mobile Reference Workflow

1. Clinician opens the portal on a tablet/mobile device (or the Capacitor shell).
2. Use calculators at `/calculators` or any embedded tool, then tap **Save to Reference Card**.
3. Add time-stamped notes via the green “+” FAB in the drawer.
4. Export (copy, print, email, SMS) or clear cards directly from the drawer; everything expires automatically after 24 hours.

For deeper UX details, animations, and troubleshooting guides, see `docs/REFERENCE_CARD_SYSTEM.md`.

## Content Team Workflow

1. Log into `/admin` with a content-team or admin-team account.
2. Draft or reorder protocols, hospital data, calculators, or assets. Collections are orderable and draft-enabled out of the box.
3. Use live preview to verify updates, then publish. Hooks trigger on-demand revalidation so the frontend reflects the change immediately.
4. Optional: queue scheduled go-lives through Payload jobs (requires `CRON_SECRET` when triggered externally).

## Native Shell (Android)

- Sync the web assets with `npx cap sync android` (or `pnpm cap sync android` if you add a script).
- Open the project in Android Studio from `android/` and build as usual.
- The Capacitor server points to `https://ucair.care`; update `capacitor.config.ts` if you need a staging URL.

## Additional Documentation

- `docs/REFERENCE_CARD_SYSTEM.md` – functional spec, architecture notes, testing checklist.
- `REFERENCE_CARD_IMPLEMENTATION.md` – summary of what was shipped.
- `src/components/ReferenceCard/__tests__/useReferenceCard.test.ts` – browser-console helpers.

## Support & Questions

File GitHub issues in this repo or reach out to the engineering/content team on our internal Slack channel. For Payload-specific questions, consult their docs or the Payload Discord.
