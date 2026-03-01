# WLPApp

Constraint-based meal planning application focused on metabolic safety, macro adherence, household scaling, and unified shopping output.


## Quick Start: Run and Test the App

### 1) Install dependencies
```bash
npm install
```

### 2) Start the API
```bash
npm run start:api
```
- API runs on `http://127.0.0.1:4000` by default.
- Health checks:
  - `GET /health`
  - `GET /health/live`
  - `GET /health/ready`
  - `GET /metrics`

### 3) Start the Web app (in another terminal)
```bash
npm run start:web
```
- Web runs on `http://127.0.0.1:3000` by default.
- The web app proxies `/api/*` requests to the API service.

### 4) Run the full test suite
```bash
npm run lint
npm run test:unit
npm run test:property
npm run test:integration
npm run test:contract
```

### 5) Run coverage gates
```bash
npm run coverage:engine
npm run coverage:check
```

### 6) Run release-readiness checks
```bash
npm run qa:release
```
- Generates: `artifacts/release-readiness-checklist.md`.

### 7) Run mobile Lighthouse quality gate locally
```bash
npm run qa:mobile
```
- Uses `.lighthouserc.json` and checks PWA/performance thresholds used by CI.

## Schema Source of Truth

- The canonical schema spec is [`db/schema.models.md`](db/schema.models.md). All entity names, relationships, and naming updates must be made there first.
- Migration SQL files should stay implementation-focused and reference the canonical schema doc instead of repeating long entity inventories.
- `README.md` should summarize schema intent and link to the canonical doc, not duplicate full model definitions.

## Revised Delivery Plan

> Execution tracker: see [`docs/phase-task-tracker.md`](docs/phase-task-tracker.md) for cross-off task status by phase.

### Phase 0: Domain Model & Rules Contract (Pre-DB)
- Publish a canonical contract package (types + validation + examples) that must be imported by all downstream services before schema/migration work starts.
- Define canonical entities/relationships via the schema source-of-truth: [`db/schema.models.md`](db/schema.models.md).
- Define rule contracts and required acceptance criteria:
  - **BMR/TDEE contract (Mifflin-St Jeor + activity multipliers)**
    - Inputs: `sex`, `ageYears`, `heightCm`, `weightKg`, `activityLevel`.
    - Expected output: `{ bmrKcal, tdeeKcal, activityMultiplier, roundingPolicy }`.
    - Validation errors: unsupported `sex`, non-positive anthropometrics, `ageYears < 18` (unless pediatric mode exists), unknown activity level.
    - Acceptance criteria examples:
      - Standard female profile returns deterministic BMR/TDEE using declared multiplier table.
      - Standard male profile returns deterministic BMR/TDEE using declared multiplier table.
      - Invalid input shape produces typed validation errors (no silent fallback).
  - **Weekly fat-loss safety cap contract (<= 1% bodyweight/week)**
    - Inputs: `currentWeightKg`, `requestedWeeklyLossKg` (or equivalent requested deficit).
    - Expected output: `{ approvedWeeklyLossKg, maxAllowedWeeklyLossKg, appliedCap: boolean }`.
    - Validation errors: non-positive bodyweight, negative requested loss, incompatible units.
    - Acceptance criteria examples:
      - Requests below cap are unchanged.
      - Requests above cap are clamped to exactly `0.01 * currentWeightKg`.
      - Boundary case at exactly 1% is accepted without clamp.
  - **Sex-based calorie floor contract (female 1200, male 1600)**
    - Inputs: `sex`, `proposedDailyCalories`.
    - Expected output: `{ finalDailyCalories, floorCalories, floorApplied: boolean }`.
    - Validation errors: unsupported `sex`, non-positive calorie proposal.
    - Acceptance criteria examples:
      - Female plan below 1200 is raised to 1200.
      - Male plan below 1600 is raised to 1600.
      - Values above floor remain unchanged.
  - **Macro allocation strategy + fallback contract**
    - Inputs: `dailyCalories`, `weightKg`, optional strategy preferences, dietary constraints.
    - Expected output: `{ proteinG, fatG, carbG, strategyUsed, fallbackApplied, residualCalories }`.
    - Validation errors: non-positive calories/weight, infeasible constraints (e.g., minimum protein+fat exceeds calories).
    - Acceptance criteria examples:
      - Primary strategy allocates protein/fat first, then assigns remaining calories to carbs.
      - If primary strategy fails feasibility checks, fallback strategy is selected and surfaced via `fallbackApplied=true` + reason code.
      - Outputs always satisfy calorie reconciliation tolerance and non-negative macro grams.
- Governance requirement: downstream phases (schema, services, planner engine, and APIs) must consume these contracts directly (shared package or generated artifacts), and any rule changes must be made contract-first to prevent logic drift.
- Contract fixture set for deterministic examples and edge/error cases: `tests/fixtures/metabolic-contract-fixtures.json` (consumed by QA tests to prevent duplicate assumptions).

### Phase 1: Core Infrastructure
- Create monorepo structure.
- Set up frontend (Next.js).
- Set up backend (Node.js + Express).
- Configure PostgreSQL and local dev environment.
- Add CI pipeline scaffold (lint, test, build).

#### Current bootstrap status
- Monorepo workspaces are initialized via root `package.json` workspaces (`apps/*`).
- `apps/web` and `apps/api` now include runnable scaffolds (Next.js web shell + Express API shell) to unblock parallel feature work.
- API scaffold now includes recipe catalog filtering preview endpoint (`/v1/recipes`) with cuisine/meal-type/include/exclude ingredient filtering.
- Planner preview endpoint available at `/v1/plans/preview` for deterministic seeded plan debugging and safety preview.
- API scaffold now includes profile and idempotent planning endpoints (`/v1/profile`, `/v1/plans/generate`).
- API scaffold now includes shopping consolidation preview endpoint (`/v1/shopping/preview`) with pantry exclusion support.
- API scaffold now includes recipe import run endpoints (`/v1/imports`, `/v1/imports/:id`) with dedupe detection.
- API scaffold now includes health probes (`/health/live`, `/health/ready`) plus `x-request-id` correlation headers and structured request logs.
- API scaffold now includes `/metrics` for service counters/route stats used by Phase 12 alerting baselines.
- Production baseline files added: `.env.production.example`, `.github/workflows/deploy-production.yml`, and `docs/operations/production-runbook.md`.
- Web scaffold now includes a baseline PWA setup (manifest + service worker + mobile app meta tags) and Android readiness guidance at `docs/mobile/android-readiness.md`.
- Android execution docs now include an emulator testing guide and Play submission runbook (`docs/mobile/android-studio-testing.md`, `docs/mobile/play-store-submission-runbook.md`) plus an Android signing baseline workflow (`.github/workflows/android-release-baseline.yml`).
- Android TWA shell bootstrap automation is now available via `npm run android:twa:init` (see `docs/mobile/twa-bootstrap.md`).
- Android shell bootstrap smoke validation is now enforced in CI (`.github/workflows/android-shell-smoke-gate.yml`) and runnable locally via `npm run android:twa:smoke`.
- Android launch-go/no-go criteria are documented at `docs/mobile/android-launch-readiness.md`, with a tagged release gate at `.github/workflows/android-launch-readiness-gate.yml` and local check command `npm run android:launch:check`.
- Android signing preflight is automated via `.github/workflows/android-release-baseline.yml` and locally via `npm run android:release:preflight` (validates docs + signing secrets).
- Android release evidence packet generation is available via `npm run android:release:packet` and uploaded by the Android release baseline workflow.
- Android release packet schema validation is available via `npm run android:release:packet:check` and is enforced before artifact upload in CI, including per-document SHA-256 integrity verification, source git revision validation, and CI expected-SHA binding.
- Compliance baseline now includes repository-tracked privacy/Data Safety docs and a CI compliance-doc gate (`docs/compliance/privacy-policy.md`, `docs/compliance/play-store-data-safety-checklist.md`, `.github/workflows/compliance-doc-gate.yml`).
- QA hardening now includes shared API payload contract validators (`src/contracts/api.js`) with contract tests against live API responses.
- Web scaffold now keeps profile/planner state in browser localStorage (local-only persistence; no hosted profile storage required).
- Web scaffold now includes tabbed Profile/Planner/Recipes/Shopping sections, two-member profile setup with optional second-person toggle, unit-aware weekly-loss input, multi-select cuisine preferences, ingredient exclusion multi-select from meal-bank ingredients, member-ID planner toggle with per-member scaled macros in planner cards, calibrated per-member meal scaling to keep weekly average calories within ±50 of target when possible, a unique recipe picker with quantities + instructions, a 7-day drag-and-drop planner with meal bank swaps, and categorized shopping totals shown in table format with JSON export.
- CI-friendly root `build` script now executes workspace build scripts.

#### Local startup commands (scaffold)
- Install dependencies (workspace-aware): `npm install`
- Start local PostgreSQL (Docker): `npm run db:up`
- Check PostgreSQL service status: `npm run db:status`
- Start web scaffold (default `http://localhost:3000`): `npm run start:web`
  - Web calls `/api/*` on the same origin; Next.js rewrites these to the API service (default `http://127.0.0.1:4000`).
  - Keep `npm run start:api` running while using web flows, otherwise UI actions show a friendly API-unreachable error.
  - Optional custom port (cross-platform): `PORT=3100 npm run start:web` (PowerShell: `$env:PORT=3100; npm run start:web`, CMD: `set PORT=3100&& npm run start:web`).
  - Uses a cross-platform Node launcher (`apps/web/scripts/dev-server.js`) to avoid Windows `spawn EINVAL` issues with direct `.cmd` execution.
- Start api scaffold (default `http://localhost:4000`): `npm run start:api`
- Run aggregate build: `npm run build`
- Stop local services (including DB): `npm run db:down`

#### Local database defaults
- Host: `localhost`
- Port: `5432`
- Database: `wlpapp`
- Username: `wlpapp`
- Password: `wlpapp`


**Definition of Done (Template)**
- **Required deliverables:** Monorepo workspace configuration, Next.js app scaffold, Express API scaffold, local PostgreSQL setup docs/scripts, CI workflow files.
- **Mandatory checks:** Lint and typecheck pass for all packages; baseline unit test suite passes; CI build jobs pass on pull requests.
- **Ownership:** Platform/Infrastructure area (`packages/config`, `apps/web`, `apps/api`, CI workflows).
- **Exit criteria (verifiable):**
  - Repository contains runnable `apps/web` and `apps/api` packages with documented startup commands.
  - CI executes lint, test, and build jobs successfully on a clean checkout.
  - Local developer environment can start web, API, and database services using documented commands.

### Phase 2: Data Model & Migrations
- Implement schema described in [`db/schema.models.md`](db/schema.models.md), including canonical `planning_runs` (business-level run records) and `rule_execution_artifacts` (rule-engine-level events).
- Preserve terminology split in future migrations: business lifecycle changes map to `planning_runs`; rule trace/detail evolution maps to `rule_execution_artifacts`.
- Add unit/category metadata and normalization fields for ingredients.
- Add household/member linking with role and ownership metadata.
- Add soft-delete and created/updated timestamps for core entities.
- Add explicit indexes for household week-based plan queries and recipe filtering by cuisine/meal type.


**Definition of Done (Template)**
- **Required deliverables:** Versioned migration files, ORM/entity schema definitions, ERD/API data model notes, seed fixtures for core entities.
- **Mandatory checks:** Migration up/down tests pass; schema lint/format checks pass; integration tests validate critical relations and constraints.
- **Ownership:** Data/Backend area (`apps/api` persistence layer and migration package).
- **Exit criteria (verifiable):**
  - All entities/relationships from [`db/schema.models.md`](db/schema.models.md) exist in migration history and can be applied to a fresh database.
  - Required indexes, timestamps, and soft-delete fields are present and validated by tests.
  - Rollback and re-apply of latest migration set succeeds without data-model drift.

### Phase 3: Calorie & Macro Engine
- Implement BMR/TDEE with unit conversions and activity multipliers.
- Implement deficit logic with daily conversion and 1% weekly cap.
- Enforce calorie floors.
- Implement macro calculation (protein/fat/carb strategy).
- Add unit + edge-case tests for all constraint logic.


**Definition of Done (Template)**
- **Required deliverables:** Rule-engine modules for BMR/TDEE, deficit cap, calorie floors, macro allocation, and typed contract interfaces.
- **Mandatory checks:** Lint/typecheck pass; unit and edge-case tests pass; core engine coverage >= 90% line and >= 85% branch.
- Enforcement note: `npm run coverage:engine` gates metabolic engine coverage at line >= 90% and branch >= 85%.
- **Ownership:** Nutrition Engine area (`packages/domain-rules` and API integration adapters).
- **Exit criteria (verifiable):**
  - Contract test vectors for each rule return deterministic outputs.
  - Safety constraints (1% weekly cap and calorie floors) are enforced in all tested scenarios.
  - Coverage report meets thresholds for core engine modules in CI.

### Phase 4: Recipe Catalog & Filtering
- Seed initial structured recipe set with cuisine/meal-type/macro metadata.
- Implement filters: cuisine, ingredient inclusion/exclusion, meal type.
- Add validation checks for recipe completeness and normalization.


**Definition of Done (Template)**
- **Required deliverables:** Structured recipe seed dataset, recipe/ingredient metadata schema, filtering service/API endpoints, normalization validators.
- **Mandatory checks:** Lint/typecheck pass; catalog import/seed tests pass; filter integration tests pass; data quality checks report no blocking validation errors.
- **Ownership:** Catalog area (`apps/api` recipe modules and seed data package).
- **Exit criteria (verifiable):**
  - Recipe records include cuisine, meal-type, and macro metadata required by planner queries.
  - Filter endpoints return correct include/exclude behavior for defined test fixtures.
  - Ingredient units and quantities pass normalization validation for all seeded recipes.

### Phase 5A: Weekly Planner Algorithm Design
- Design artifact: [`docs/planner/algorithm-design.md`](docs/planner/algorithm-design.md).
- Define planner objective function and scoring weights:
  - Macro target fit score
  - Ingredient overlap score
  - Cuisine/meal-type preference score
  - Prep-time and bulk-cook preference score
- Classify constraints into:
  - Hard constraints (must pass)
  - Soft constraints (optimize in score)
- Specify tie-break behavior for equivalent scores.
- Define fallback behavior when exact macro match is impossible.


**Definition of Done (Template)**
- **Required deliverables:** Planner design spec (objective function, constraint taxonomy, tie-breaks), scoring weight table, fallback decision matrix.
- **Mandatory checks:** Design review checklist approved; spec lint/docs checks pass; traceability matrix links requirements to planned tests.
- **Ownership:** Planning Algorithm area (`docs/planner` and domain-rules maintainers).
- **Exit criteria (verifiable):**
  - Spec defines hard vs soft constraints with machine-testable rule statements.
  - Tie-break and fallback behavior is fully specified with deterministic examples.
  - Approved design artifact is referenced by implementation tasks and test plan IDs.

### Phase 5B: Weekly Planner Engine Implementation
- Implement deterministic, seed-based plan generation for reproducible plans.
- Implement hard-constraint filtering + soft-constraint scoring execution.
- Implement macro-match fallback logic from the algorithm design.
- Add planner debug output for why meals were selected or rejected.


**Definition of Done (Template)**
- **Required deliverables:** Planner engine implementation, deterministic seeded execution path, scoring/fallback modules, debug/trace artifacts.
- **Mandatory checks:** Lint/typecheck pass; planner unit/integration tests pass; reproducibility test confirms identical output for same seed/input; planner coverage >= 85% line.
- **Ownership:** Planning Engine area (`apps/api` planner services + shared scoring package).
- **Exit criteria (verifiable):**
  - Re-running planner with same inputs and seed produces byte-equivalent plan output.
  - Hard constraints are never violated in integration test fixtures.
  - Debug traces expose accepted/rejected candidate reasons for each generated plan.

### Phase 6: Shopping List Engine
- Aggregate scaled ingredients across household plans.
- Normalize units and consolidate duplicates.
- Group by category (produce/meat/dairy/pantry/spices).
- Add optional warehouse/bulk optimization mode.


**Definition of Done (Template)**
- **Required deliverables:** Shopping aggregation engine, unit normalization/consolidation module, category grouping logic, bulk-mode optimizer toggles.
- **Mandatory checks:** Lint/typecheck pass; aggregation unit tests pass; end-to-end planner-to-shopping integration tests pass; normalization accuracy checks >= 99% on fixture set.
- **Ownership:** Shopping area (`apps/api` shopping modules and shared unit-conversion utilities).
- **Exit criteria (verifiable):**
  - Duplicate ingredients are consolidated with normalized units in generated lists.
  - Category grouping matches configured taxonomy for all test fixtures.
  - Optional bulk optimization mode can be enabled/disabled and verified through tests.

### Phase 7: URL Recipe Import
- Build full ingestion pipeline stages:
  - Fetch URL
  - Parse schema.org data
  - Normalize ingredient quantities/units
  - Map nutrition (structured data first, heuristic estimate fallback)
- Add deduplication via canonical URL + normalized recipe-name/content-hash heuristics.
- Enforce validation rules for required recipe fields and ingredient unit parsing.
- Add fallback extraction when schema.org payloads are missing or malformed.
- Persist source attribution and import status/error tracking fields for observability.


**Definition of Done (Template)**
- **Required deliverables:** URL ingestion pipeline stages, schema.org parser, normalization/mapping modules, deduplication logic, import status/error persistence schema.
- **Mandatory checks:** Lint/typecheck pass; importer unit and integration tests pass; malformed URL/payload validation tests pass; import fixture suite >= 95% parse completeness.
- **Ownership:** Importer area (`apps/api` import worker/services and persistence adapters).
- **Exit criteria (verifiable):**
  - Imports persist canonical source attribution, dedupe keys, and terminal status for every run.
  - Fallback extraction path is triggered and validated when structured data is absent.
  - Validation rejects malformed payloads with typed, observable error reasons.

### Phase 8: Backend API Design & Access Controls (Required Before UI)
- Define versioned REST/GraphQL contracts for:
  - Profile and household setup
  - Weekly plan generation
  - Meal swaps/regeneration
  - Shopping list retrieval/export
- Implement authentication and household-scoped authorization rules.
- Add subscription feature-gate checks to enforce free vs paid capabilities.
- Add idempotency patterns for plan generation endpoints to prevent duplicate runs.
- Add rate limiting for URL import and planner generation endpoints.

### Phase 9: Cross-Platform Readiness
- Define API versioning strategy (`/v1`) and backward compatibility policy:
  - Add deprecation windows and sunset headers for breaking changes.
  - Require additive-first schema evolution and contract test coverage for mobile-safe endpoints.
- Ensure clear frontend/business-logic separation:
  - Keep planning/business rules in backend services shared by web and mobile clients.
  - Restrict Next.js app to presentation/orchestration concerns that consume backend contracts.
- Add offline-friendly endpoints/data shapes for mobile sync:
  - Weekly plans endpoint with stable IDs, revision metadata, and delta-friendly timestamps.
  - Shopping list endpoint with normalization snapshots and conflict-safe item states.
- Add mobile-compatible auth/session strategy:
  - Short-lived access tokens + rotating refresh tokens.
  - Device-scoped session management and revocation support.
- Create follow-up implementation task block for native clients:
  - React Native bootstrap path (shared JS/TS model layer).
  - Kotlin Android bootstrap path (native client + generated API bindings).
  - Decision checkpoint documenting chosen client strategy and rollout criteria.

### Phase 10: UI Implementation
- Household setup flow (members + biological inputs + goals).
- Weekly review flow (macro visibility, swap/regenerate).
- Shopping list view (grouped list + export).

### Phase 11: Dedicated QA & Release Readiness
- Enforce pre-deployment QA gate for every release candidate.
- Add unit tests for BMR/TDEE calculations, deficit-cap enforcement, calorie floors, and macro split logic.
- Add property and edge-case tests for extreme physiological input ranges and aggressive goals.
- Add integration tests for weekly plan generation and shopping-list aggregation behavior.
- Add API contract tests validating frontend/backend request-response compatibility.
- Enforce CI coverage thresholds for core engine modules before deployment.
- Run `npm run qa:release` before a release candidate to execute the QA bundle and generate `artifacts/release-readiness-checklist.md`.

### Phase 12: Production Readiness & Deployment
- Add structured logging with request correlation IDs propagated across API, planner jobs, and import workers.
- Add `/health/live` and `/health/ready` endpoints with dependency checks, including PostgreSQL connectivity and migration status.
- Add service-level metrics dashboards and alerts for:
  - Planner latency (p50/p95/p99)
  - Recipe import success rate
  - Rule-validation failure counts by rule type
- Add error monitoring and alert thresholds for critical services (API, planner, importer, database) with on-call escalation paths.
- Define and test backup/restore runbooks plus migration rollback procedures before production cutovers.
- Require the dedicated QA phase to pass in CI before deploy jobs can run.
- Deploy backend (Render/Railway) and frontend (Vercel).
- Configure secure environment variables and production DB.

## Testing Strategy (Cross-Phase)
- Unit tests for rule engine and nutrition/macro calculations, including BMR/TDEE, deficit caps, calorie floors, and macro split logic.
- Property and edge-case tests for very low/high weight, age boundary values, and aggressive goal scenarios.
- Integration tests for weekly plan generation and shopping aggregation.
- Contract tests for frontend/backend APIs.
- Coverage gate for core metabolic/planning modules enforced by CI.

## Repository Workflow Rules
- Follow the required branch/PR naming convention in `CONTRIBUTING.md`.
- Merge to `main` through Pull Requests only (no direct pushes).
- GitHub enforcement details live in `.github/workflows/pr-policy.yml` and `.github/BRANCH_PROTECTION.md`.
- Automation scripts for auth/PR creation live in `scripts/bootstrap_github_auth.sh` and `scripts/create_pr.sh`.
- Multi-agent program operations and lane/dependency model live in `docs/multi-agent-workflow.md`.
- Handoff templates for cross-agent contract/schema/QA transfers live in `docs/handoffs/`.
