# AGENTS.md

## Commands

- Use `pnpm`; the lockfile is `pnpm-lock.yaml` and native builds are controlled in `pnpm-workspace.yaml`.
- Verify changes with `pnpm build`, `pnpm test`, and `pnpm test:e2e`.
- Format the repo with `pnpm format:project`; it uses `prettier-eslint` for TS/MJS, auto-sorts imports/exports via ESLint, and uses Prettier for JSON/Markdown/YAML.
- Run the focused import e2e with `pnpm test:e2e:import`; use `pnpm test:e2e:debug` for `--runInBand --detectOpenHandles --verbose`.
- `pnpm lint` runs ESLint with `--fix`; do not use it as a read-only check.
- Start the Nest REPL with `pnpm repl`.

## Generated API Client

- Do not manually edit files under `planner-web/src/api/generated/**`.
- If the generated planner-web API client, models, or Zod schemas are wrong, fix the OpenAPI source in this repository (`planner-api`) instead. Update DTOs, Swagger decorators, controller response types, or entity-facing response DTOs so `/api/v1/docs-json` is correct.
- After fixing the OpenAPI spec in `planner-api`, regenerate the web client from `planner-web` with:

  ```sh
  pnpm run api:generate
  ```

- Always review regenerated Zod schemas. Avoid producing `[key]: zod.looseObject({}).nullish()` or equivalent loose-object index signatures because they are known to cause runtime validation issues and can completely break the app.
- If dynamic JSON-like fields are required, model them explicitly in the OpenAPI spec with stable DTOs or safer schema shapes instead of relying on loose anonymous object maps.
- Never use `@ApiProperty({ type: Object })`, bare `object`, or `Record<string, unknown>` on DTOs exposed through Swagger/OpenAPI. These often generate `{ [key: string]: unknown }` or `zod.looseObject({})` in the generated client.
- For nullable primitive fields, always specify the Swagger primitive type explicitly (for example `@ApiPropertyOptional({ nullable: true, type: String })` for `string | null`) so reflection does not fall back to an object schema.
- If a JSON-like field has a stable shape, create named DTOs for that shape; if it has multiple known variants, model them with explicit wrapper DTOs and OpenAPI `oneOf` instead of a generic map.
- Only allow object maps when arbitrary keys are truly required, and then prefer typed `additionalProperties` such as `{ type: 'number' }` over unknown/object values.

## App Wiring

- Runtime entrypoint is `src/main.ts`; it sets global prefix `api`, URI versioning, and default version `1`, so API routes are `/api/v1/...`.
- Swagger is mounted under the API version at `/api/v1/docs`.
- TypeORM uses SQLite from `DATABASE_PATH` or `planner.sqlite`; local `*.sqlite` files are ignored.
- TypeORM has `synchronize: true`; there are no migrations yet.
- `RouterModule` maps `HealthModule` under `health` and `PlannerModule` under `plans`; controllers use empty paths inside those modules.

## Planner Domain

- Main planner files are `src/planner/entities.ts`, `dto.ts`, `planner.cqrs.ts`, `planner.service.ts`, and `planner.controller.ts`.
- Keep controller methods thin: they dispatch CQRS commands/queries; business logic lives in `PlannerService`.
- The source seed document is `src/plan-financiero.json`; `POST /api/v1/plans/import-json` maps it into normalized tables and returns a compact import summary.
- Dynamic income generation is rule-based: `income_schedule_amount_rules.paymentNumberInMonth` determines each generated payment amount after counting payments within that month.
- If adding nullable string columns to TypeORM entities, specify `type: 'varchar'` or `type: 'text'`; SQLite rejects reflected `Object` types from `string | null`.

## Tests

- Unit tests live under `src` and are matched by package.json Jest config (`rootDir: src`, `*.spec.ts`).
- E2E tests live under `test` and use `test/jest-e2e.json`.
- E2E setup mirrors `main.ts` manually: set global prefix `api`, URI versioning, and the global validation pipe in tests too.
- E2E tests set `process.env.DATABASE_PATH = ':memory:'` before compiling `AppModule`; preserve that order to avoid writing `planner.sqlite`.
- Suites/Automock requires both `@automock/jest` and `@automock/adapters.nestjs`; the adapter postinstall is allowed in `pnpm-workspace.yaml`.
