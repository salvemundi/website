# Project Context - Salve Mundi V7

## Overview
Dit project is de v7 re-write van de Salve Mundi website, een Next.js 16 monorepo met een Directus backend.

## Architecture
- **Framework**: Next.js 16 (App Router, Turbopack, PPR).
- **Styling**: TailwindCSS 4, Custom Design System in `index.css`.
- **Hybrid Components**: Gebruik van `isLoading` props in UI componenten om Skeletons te renderen zonder Cumulative Layout Shift (CLS).
- **Monorepo**: Beheerd met pnpm.

## Current Migration: Skeleton System
We zijn bezig met het migreren van handmatige skeleton loaders naar een gecentraliseerd systeem om code-duplicatie te verminderen en consistentie te waarborgen.

### Key Components
- `apps/frontend/src/components/ui/Skeleton.tsx`: De nieuwe primitive voor pulse placeholders.
- `EventsSection.tsx`, `EventCard.tsx`, `HeroIsland.tsx`: Reeds gemigreerd naar het hybride model met de `Skeleton` primitive.

### Status (2026-04-07)
- [x] Create `Skeleton` primitive.
- [x] Refactor homepage components (`EventsSection`, `HeroIsland`, `SponsorsSection`).
- [x] Refactor Profile/Account islands (including `TransactionsIsland`).
- [x] Refactor remaining "Skeleton" components to use the new primitive (including `ActivityCardSkeleton`, `MembershipSkeleton`, `KroegentochtSkeleton`).

## Recent Changes (Git Status)
- **Modified**: 31 files.
- **Insertions**: ~1300 lines.

## Technical Debt & Future Work
- **Signup Form Visibility**: Investigate the conflicting global rule that currently necessitates the forced visibility override in `vendor.css`.
- **Legacy Migrations**: Finalize the transition of all Directus Relations to the internal SQL schema for trip registrations.
