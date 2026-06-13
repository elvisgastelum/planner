# AGENTS.md

- This repo is a flat two-package project: `planner-api/` and `planner-web/`. Run `pnpm` commands inside the package you are changing; there is no shared root workspace.
- Treat this file as the repo-level pointer; the package-local `AGENTS.md` files are the source of truth for commands, tests, and package-specific rules.
- Read the package-local `AGENTS.md` first:
  - `planner-api/AGENTS.md` for NestJS/TypeORM/CQRS, OpenAPI, and test rules.
  - `planner-web/AGENTS.md` for Vite/React/TanStack Router, Orval generation, and frontend conventions.
- Do not edit generated frontend files by hand: `planner-web/src/routeTree.gen.ts` and `planner-web/src/api/generated/**`.
- The backend OpenAPI JSON at `planner-api` is the source of truth for frontend API generation; fix DTOs/Swagger decorators there, then regenerate the web client.
- Keep API and web changes aligned with their package commands and checks; package-local AGENTS document the exact scripts and repo-specific gotchas.
