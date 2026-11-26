# EnviroLink Platform Documentation 🌱

This directory documents the production architecture, live deployments, Supabase data model, AI validation pipelines, and portal workflows for **EnviroLink**.

## Live Production Portals

| Application | Directory | Live Production URL |
| :--- | :--- | :--- |
| **Citizen Web App** | [`citizen-app/`](../citizen-app) | https://envirolink-citizen.vercel.app |
| **Authority Control Dashboard** | [`authority-dashboard/`](../authority-dashboard) | https://envirolink-admin.vercel.app |
| **Field Worker Portal** | [`worker-portal/`](../worker-portal) | https://envirolink-worker.vercel.app |

## Documentation Index

1. **[Root Project Overview & Setup Guide](../README.md)** — Portal links, feature overview, environment variables, and local dev commands.
2. **[Complete System Specification](./SYSTEM_SPECIFICATION.md)** — Deep technical documentation covering:
   - End-to-end 3-portal Next.js `16.1.1` + Supabase architecture
   - PostgreSQL tables (`reports`, `report_images`, `profiles`, `workers`), indexes & storage policies
   - Next.js App Router API routes (`/api/analyze-image`, `/api/geocode`, `/api/speech-to-text`, `/api/verify-completion`, `/api/reports`)
   - Client-side lock-free `@supabase/ssr` session hydration & single-query PostgREST joins
   - GeoTag live camera (`GeoTagCameraModal`) + EXIF GPS extraction (`geotag.ts`)
   - Multi-worker crew encoding (`crew:<ids>`) & worker backup escalation workflows
   - **EnviroLink GreenPerks 🌱** zero-ad CSR rewards marketplace (`/perks`)
   - Landscape executive & reports PDF generation (`pdfExport.ts`)
3. **[Supabase Setup Guide](../citizen-app/SUPABASE_SETUP.md)** — Step-by-step storage bucket (`report-images`) and Auth configuration.
4. **[Citizen Environment Guide](../citizen-app/ENV_SETUP.md)** — API key reference for local testing.

## Core Tech Stack Summary

- **Frontend:** Next.js `16.1.1` (App Router + Turbopack), React `19.2.3`, TypeScript `5`, Tailwind CSS v4, Framer Motion `12.x`, Zustand `5.x`
- **Backend / BaaS:** Supabase PostgreSQL, Supabase GoTrue Auth (Google OAuth + Email/Password), Supabase Storage (`report-images`), Supabase Realtime (`postgres_changes`)
- **AI / Media:** OpenRouter Vision (`nvidia/nemotron-3.5-super-vl:free`), Groq/Gemini fallback, client EXIF GPS & Canvas watermarking
- **Mapping & Exports:** Leaflet `1.9.4`, React-Leaflet `5.x`, OpenStreetMap & CARTO tiles, `jsPDF` `3.x` + `jspdf-autotable` `5.x`
