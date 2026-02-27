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
- [ ] Enforce and document explicit coverage thresholds for engine modules.

## Phase 4 — Recipe Catalog & Filtering
- [ ] Seed structured recipe dataset with cuisine/meal-type/macro metadata.
- [ ] Implement recipe filtering (cuisine, include/exclude ingredients, meal type).
- [ ] Add recipe normalization and completeness validators.

## Phase 5A — Weekly Planner Algorithm Design
- [ ] Define planner objective function and scoring weights.
- [ ] Define hard vs soft constraint taxonomy.
- [ ] Define tie-break and macro-fallback behavior.
- [ ] Publish design artifact with traceability to test cases.

## Phase 5B — Weekly Planner Engine Implementation
- [ ] Implement deterministic seed-based planner engine.
- [ ] Implement hard-constraint filtering + soft-constraint scoring pipeline.
- [ ] Implement macro-match fallback execution path.
- [ ] Add planner debug trace output and reproducibility tests.

## Phase 6 — API Endpoints
- [ ] Add profile + goal management endpoints with validation.
- [ ] Add planning endpoints and idempotency keys.
- [ ] Add endpoint-level tests and validation error contracts.

## Phase 7 — Shopping List Consolidation
- [ ] Aggregate duplicate ingredients across selected recipes.
- [ ] Normalize ingredient units and support conversion map.
- [ ] Add grouped shopping list API with pantry-aware reduction.

## Phase 8 — Recipe Import Pipeline
- [ ] Build URL import API endpoint and import status model.
- [ ] Add schema.org parsing and fallback extractor logic.
- [ ] Add dedupe keying and import validation/error states.

## Phase 9 — QA Hardening
- [ ] Extend unit/edge coverage for metabolic/planning boundaries.
- [ ] Add integration coverage for planner + shopping + import flows.
- [ ] Add API contract tests for frontend/backend payload parity.

## Phase 10 — Frontend UI (MVP)
- [ ] Build profile and goal setup flow.
- [ ] Build weekly planner view with regenerate/swap flow.
- [ ] Build shopping list grouped view and export action.

## Phase 11 — Dedicated QA & Release Readiness
- [ ] Enforce pre-deploy QA gate for release candidates.
- [ ] Validate coverage thresholds for core engine modules.
- [ ] Capture test evidence and release readiness checklist artifacts.

## Phase 12 — Production Readiness & Deployment
- [ ] Add structured logging and request correlation IDs.
- [ ] Add liveness/readiness endpoints with dependency checks.
- [ ] Define metrics/alerts/runbooks for planner, importer, and DB.
- [ ] Configure production deployment and secure environment variables.
