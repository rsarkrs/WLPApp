# WLPApp Phase Task Tracker

Use this checklist as the execution ledger for roadmap phases in `README.md`.

## Phase 0 — Domain Model & Rules Contract
- [x] Publish canonical rule fixtures for deterministic examples and edge/error cases.
- [x] Implement contract logic for BMR/TDEE, weekly cap, calorie floor, and macro allocation.
- [x] Add contract/unit/property tests that validate deterministic outputs and typed error handling.
- [x] Keep contract-first governance reflected in repo docs.

## Phase 1 — Core Infrastructure
- [x] Initialize monorepo workspace structure (`apps/*`).
- [x] Scaffold frontend with Next.js.
- [x] Scaffold backend with Express.
- [x] Add local PostgreSQL dev environment via Docker Compose and npm scripts.
- [x] Ensure CI executes lint/test/build through QA gate workflow.

## Phase 2 — Data Model & Migrations
- [x] Implement schema and migrations for core entities plus planning/rule artifacts.
- [x] Add ingredient metadata and household/member linking metadata.
- [x] Apply soft-delete + created/updated timestamps across core entities.
- [x] Add indexes for household week queries and recipe cuisine/meal-type filters.

## Phase 3 — Calorie & Macro Engine
- [x] Implement reusable metabolic engine module for BMR/TDEE, weekly cap, floors, and macro allocation.
- [x] Wire engine into existing contract test harness.
- [x] Expose API preview endpoint for metabolic calculation validation.
- [x] Enforce and document explicit coverage thresholds for engine modules.

## Phase 4 — Recipe Catalog & Filtering
- [x] Seed structured recipe dataset with cuisine/meal-type/macro metadata.
- [x] Implement recipe filtering (cuisine, include/exclude ingredients, meal type).
- [x] Add recipe normalization and completeness validators.

## Phase 5A — Weekly Planner Algorithm Design
- [x] Define planner objective function and scoring weights.
- [x] Define hard vs soft constraint taxonomy.
- [x] Define tie-break and macro-fallback behavior.
- [x] Publish design artifact with traceability to test cases.

## Phase 5B — Weekly Planner Engine Implementation
- [x] Implement deterministic seed-based planner engine.
- [x] Implement hard-constraint filtering + soft-constraint scoring pipeline.
- [x] Implement macro-match fallback execution path.
- [x] Add planner debug trace output and reproducibility tests.

## Phase 6 — API Endpoints
- [x] Add profile + goal management endpoints with validation.
- [x] Add planning endpoints and idempotency keys.
- [x] Add endpoint-level tests and validation error contracts.

## Phase 7 — Shopping List Consolidation
- [x] Aggregate duplicate ingredients across selected recipes.
- [x] Normalize ingredient units and support conversion map.
- [x] Add grouped shopping list API with pantry-aware reduction.

## Phase 8 — Recipe Import Pipeline
- [x] Build URL import API endpoint and import status model.
- [x] Add schema.org parsing and fallback extractor logic.
- [x] Add dedupe keying and import validation/error states.

## Phase 9 — QA Hardening
- [x] Extend unit/edge coverage for metabolic/planning boundaries.
- [x] Add integration coverage for planner + shopping + import flows.
- [x] Add API contract tests for frontend/backend payload parity.

## Phase 10 — Frontend UI (MVP)
- [x] Build profile and goal setup flow.
- [x] Build weekly planner view with regenerate/swap flow.
- [x] Build shopping list grouped view and export action.
- [x] Add saved-profile loading for multi-member households (MVP two-person planning).
- [x] Add unit toggle support (imperial/metric) and target calorie auto-calculation from requested weekly loss.
- [x] Add meal bank + drag/drop planner swapping with consistent day-card formatting.
- [x] Add tabbed UI sections and readability-focused shopping table layout.
- [x] Add two-member profile cards with weight-first input ordering and unit-aware weekly-loss labels.
- [x] Add planner preference filters for cuisines plus include/exclude ingredients and wire through API preview generation.
- [x] Add recipes-used tab showing selected planner meals with ingredient details.
- [x] Expand lunch/dinner recipe variety with chinese/italian/korean options for better weekly diversity.
- [x] Add option to enable/disable second person in Profile and Goals and enforce member selection limits accordingly.
- [x] Replace planner cuisine text input with multi-select dropdown and harden filter handling so Generate Plan degrades gracefully when filters are too strict.
- [x] Replace free-text ingredient filters with ingredient exclusion multi-select sourced from meal-bank ingredients.
- [x] Enforce whole-number quantities for `item` units across planner recipe scaling and shopping outputs.
- [x] Show per-member scaled calories/macros in planner meal cards and daily totals when one or two profiles are active.
- [x] Add member-ID toggle selector above weekly planner day grid to view one member's macros/calories at a time and reduce card crowding.
- [x] Update Recipes Used to a unique recipe selector with ingredient quantities and step-by-step instructions.

## Phase 11 — Dedicated QA & Release Readiness
- [x] Enforce pre-deploy QA gate for release candidates.
- [ ] Validate coverage thresholds for core engine modules.
- [x] Capture test evidence and release readiness checklist artifacts.

## Phase 12 — Production Readiness & Deployment
- [ ] Add structured logging and request correlation IDs.
- [ ] Add liveness/readiness endpoints with dependency checks.
- [ ] Define metrics/alerts/runbooks for planner, importer, and DB.
- [ ] Configure production deployment and secure environment variables.
