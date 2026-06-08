# AI Assisted Will Maker

Production-grade will drafting platform with AI-guided interviews, built on **NestJS**, **Next.js**, and **PostgreSQL** — fully containerized with Docker.

## Status

**Domain model + NestJS auth implemented.** Core packages (`shared-kernel`, `will-domain`), Prisma schema, and JWT authentication API are in place. Web app is not yet implemented.

## Architecture Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Architecture decisions, high-level diagram, folder structure, implementation order |
| [docs/DOMAIN_MODEL.md](./docs/DOMAIN_MODEL.md) | Entities, value objects, domain services, ports, invariants |
| [docs/DOMAIN_MODEL_ERD.md](./docs/DOMAIN_MODEL_ERD.md) | ERD, aggregate boundaries, orphan prevention |
| [docs/SEQUENCE_DIAGRAMS.md](./docs/SEQUENCE_DIAGRAMS.md) | End-to-end flows: auth, interview, sync, finalize, PDF |

## Key Design Principles

- **Clean Architecture** with inward-only dependencies
- **SOLID** — swappable AI, PDF, and database adapters via ports
- **Repository + Adapter + Strategy** patterns
- **Domain / Application / Infrastructure** separation in `packages/will-domain` and `apps/api`

## Planned Stack

- Node 22 · NestJS 11 · Next.js 15 · PostgreSQL 16 · Docker Compose
- AI providers: OpenAI, Claude, Gemini (env-selected)
- PDF engines: Puppeteer, PdfKit (env-selected)

## Auth API (`apps/api`)

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/auth/register` | Public |
| POST | `/auth/login` | Public |
| POST | `/auth/refresh` | Public |
| POST | `/auth/logout` | Bearer JWT |
| GET | `/auth/me` | Bearer JWT |

### Interview API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/wills/:willId/interview` | Start AI interview |
| POST | `/wills/:willId/interview/messages` | Send message (SSE stream) |
| GET | `/wills/:willId/interview/status` | Progress + missing fields |
| POST | `/wills/:willId/interview/sync` | Apply memories to will draft |

Switch AI provider via `AI_PROVIDER=openai|claude` — no code changes required.

### Run API

```bash
cp apps/api/.env.example apps/api/.env
npm run prisma:migrate -w @will-maker/api
npm run start:dev -w @will-maker/api
```

### DI / SOLID

- `AuthService` injects `PasswordHasher`, `TokenService`, `IUserRepository`, `RefreshTokenRepository` via tokens — never concrete classes.
- Swap `BcryptPasswordHasher` for `Argon2PasswordHasher` by changing one provider binding in `AuthModule`.

## Next Step

Proceed with will drafting use cases and Next.js wizard per [docs/ARCHITECTURE.md §8](./docs/ARCHITECTURE.md#8-implementation-order-next-phase).
