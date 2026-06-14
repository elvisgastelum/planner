# Planner

Personal financial planning application for managing income schedules, payment periods, recurring expenses, debt liquidation plans, allocation categories, and emergency fund planning.

The repository contains two separate packages:

- `planner-api/` — NestJS backend API
- `planner-web/` — React frontend application

This is a flat two-package repository. There is no shared root workspace, so run `pnpm` commands inside each package directory.

---

## Tech Stack

### Backend

- [NestJS](https://nestjs.com/)
- [TypeORM](https://typeorm.io/)
- [SQLite](https://www.sqlite.org/)
- [CQRS](https://docs.nestjs.com/recipes/cqrs)
- [Swagger / OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Jest](https://jestjs.io/)

### Frontend

- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Orval](https://orval.dev/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)

---

## Project Structure

```txt
planner/
├── planner-api/          # NestJS backend
│   ├── src/
│   │   ├── planner/      # Core planner domain
│   │   ├── database/     # TypeORM config, migrations, seeds
│   │   ├── health/       # Health check module
│   │   └── main.ts       # API entry point
│   └── .env.example
│
└── planner-web/          # React frontend
    ├── src/
    │   ├── routes/       # TanStack Router routes
    │   ├── features/     # Feature modules
    │   ├── api/          # Generated API client and hooks
    │   └── components/   # UI components
    └── .env.example
```

---

## Prerequisites

- Node.js LTS
- [pnpm](https://pnpm.io/)
- SQLite support is provided through npm dependencies; no external database server is required.

---

## Environment Setup

### API

Create `planner-api/.env` (copy from `planner-api/.env.example`):

```env
DATABASE_PATH=planner.sqlite
PORT=3000
PLANNER_DEBUG=true
```

### Web

Create `planner-web/.env` (copy from `planner-web/.env.example`):

```env
VITE_API_BASE_URL=http://127.0.0.1:3000
VITE_DEBUG_LOGS=false
```

---

## Installation

Install dependencies in each package separately.

```bash
cd planner-api
pnpm install
```

```bash
cd ../planner-web
pnpm install
```

---

## Running the Application

### Start the API

```bash
cd planner-api
pnpm start:dev
```

The API runs on:

```txt
http://127.0.0.1:3000
```

Swagger/OpenAPI docs are available at:

```txt
http://127.0.0.1:3000/api/v1/docs
```

### Start the Web App

In a separate terminal:

```bash
cd planner-web
pnpm dev
```

The web app runs on:

```txt
http://localhost:5173
```

---

## Database

The backend uses SQLite. Common commands (run from `planner-api/`):

```bash
pnpm db:seed              # Seed from plan-financiero.json
pnpm db:clean             # Delete database
pnpm db:reset             # Clean + run migrations + seed
pnpm db:migration:generate # Generate a new migration
pnpm db:migration:run      # Run pending migrations
```

---

## API Client Generation

The frontend API client is generated from the backend OpenAPI schema.

Generated files must not be edited manually:

```txt
planner-web/src/api/generated/**
planner-web/src/routeTree.gen.ts
```

To regenerate the frontend API client:

1. Start the backend API.
2. Run:

```bash
cd planner-web
pnpm api:generate
```

The OpenAPI source is expected at:

```txt
http://127.0.0.1:3000/api/v1/docs-json
```

---

## Testing

### API

```bash
cd planner-api

pnpm test          # Unit tests
pnpm test:e2e      # End-to-end tests
pnpm test:cov      # Coverage report
pnpm test:watch    # Watch mode
```

### Web

```bash
cd planner-web

pnpm test          # Unit tests (Vitest)
pnpm test:cov      # Coverage report
pnpm test:watch    # Watch mode
```

---

## Build

### API

```bash
cd planner-api
pnpm build
```

Run the production build:

```bash
pnpm start:prod
```

### Web

```bash
cd planner-web
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

---

## Code Quality

### API

```bash
cd planner-api

pnpm lint              # ESLint with --fix
pnpm format:project    # Full project formatting
```

### Web

```bash
cd planner-web

pnpm lint              # ESLint
pnpm typecheck         # TypeScript check
pnpm format            # ESLint fix + Prettier
```

---

## Development Notes

- Keep backend DTOs and Swagger decorators accurate — the frontend API client is generated from the backend OpenAPI schema.
- Do not edit generated frontend files manually (`planner-web/src/api/generated/**`, `planner-web/src/routeTree.gen.ts`).
- Run package commands from inside `planner-api/` or `planner-web/`; there is no root workspace.
- The backend is the source of truth for API contracts. If the API changes, regenerate the frontend client with `pnpm api:generate`.

---

## License

This project is currently marked as private/unlicensed.
