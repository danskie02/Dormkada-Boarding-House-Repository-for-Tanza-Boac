# DormKada

## Overview

DormKada is a centralized boarding house search and reservation web platform for students in Brgy. Tanza, Boac, Marinduque, Philippines. It connects students with verified landlords, enabling real-time room search, reservation management, and tenant tracking.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/dormkada), wouter routing
- **UI**: Tailwind CSS v4, shadcn/ui components, Plus Jakarta Sans font
- **Map**: Leaflet.js + react-leaflet + OpenStreetMap
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod (zod/v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Color theme**: Blue / White / Yellow

## User Roles

- **Student**: Browse listings, filter by price/room type, view details, reserve rooms, track reservations
- **Owner**: Manage listings (CRUD), accept/reject reservations, view tenant records, toggle payment status
- **Admin**: Verify owner IDs, approve/reject property listings, suspend/delete accounts

## Key Credentials (Dev/Seed Data)

- Admin: admin@dormkada.com / admin123
- Owner: maria@santos.com / owner123
- Student: juan@student.com / student123

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/dormkada run dev` — run frontend locally

## Architecture

- `artifacts/dormkada/` — React+Vite frontend (hosted at `/`)
- `artifacts/api-server/` — Express 5 REST API (hosted at `/api`)
- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas for server validation
- `lib/db/` — Drizzle ORM schema + client

## Database Schema

- `users` — students, owners, admins
- `boarding_houses` — property listings (pending/approved/rejected)
- `rooms` — individual rooms per property
- `reservations` — student reservation requests (24hr expiry, auto-flag)
- `tenants` — accepted tenant records with payment status

## Deployment Target

Render (standard web service)
