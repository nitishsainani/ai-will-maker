# AI Will Maker — Web

Next.js 15 frontend with feature-based architecture, Container/Presentation pattern, and `ApiClient` abstraction.

## Setup

```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:4000

npm install
npm run dev -w @will-maker/web
```

Requires the API running on port 4000 with CORS enabled (`WEB_ORIGIN=http://localhost:3000`).

## Architecture

- **`src/shared/api/`** — `ApiClient` interface + `NestApiClient` (only layer that uses `fetch`)
- **`src/features/`** — `auth`, `will-builder`, `chat`, `preview`, `validation`
- Each feature: `components/` (presentation), `containers/`, `hooks/`

## Live preview refresh

After each chat message: SSE `done` → `interview.sync` → invalidate `will`, `preview`, `validation` query keys → preview panel refetches.

## Routes

| Route | Feature |
|-------|---------|
| `/login`, `/register` | auth |
| `/dashboard` | will list |
| `/wills/new` | create will |
| `/wills/[id]/chat` | AI interview |
| `/wills/[id]/builder` | will details |
| `/wills/[id]/preview` | document preview |
| `/wills/[id]/validation` | validation report |
