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
- [x] Validate coverage thresholds for core engine modules.
- [x] Capture test evidence and release readiness checklist artifacts.

## Phase 12 — Production Readiness & Deployment
- [x] Add structured logging and request correlation IDs.
- [x] Add liveness/readiness endpoints with dependency checks.
- [x] Define metrics/alerts/runbooks for planner, importer, and DB.
- [x] Configure production deployment and secure environment variables.


## Phase 13 — Mobile Productization (Android/Play Store)
- [x] Establish baseline PWA packaging assets (manifest, app icons, service worker registration).
- [x] Document Android readiness gaps and release constraints for Play Store distribution.
- [x] Add CI quality gates for mobile installability/performance (e.g., Lighthouse PWA checks).
- [x] Select packaging path (TWA vs native shell) and define signed release pipeline.


## Phase 14 — Compliance & Store Submission Readiness
- [x] Add baseline privacy policy draft in repository docs.
- [x] Add Play Store Data Safety checklist template.
- [x] Add CI gate to enforce required compliance doc presence.


## Phase 15 — Android Validation & Store Ops
- [x] Add Android Studio emulator testing guide for local/dev validation.
- [x] Add Play Store submission runbook/checklist for internal testing and release prep.
- [x] Add Android release baseline workflow with signing-secret validation placeholders.


## Phase 16 — Android Shell Automation
- [x] Add automated TWA shell bootstrap script for local packaging setup.
- [x] Add TWA bootstrap usage guide with environment variable overrides.
- [x] Add CI smoke validation for generated Android shell project structure.


## Phase 17 — Android Launch Readiness
- [x] Define explicit go/no-go criteria for Play Store launch.
- [x] Add Android launch-readiness gate workflow for tagged release candidates.
- [x] Add script to validate required launch/compliance documentation presence.


## Phase 18 — Android Release Preflight Automation
- [x] Replace Android release placeholder workflow with executable preflight steps.
- [x] Add automated preflight script that validates signing secrets and required launch docs.
- [x] Add automated test coverage for Android preflight script behavior.


## Phase 19 — Android Release Evidence Artifacts
- [x] Add release-packet generator that captures required Android launch/compliance docs.
- [x] Wire release baseline workflow to publish Android release packet artifact.
- [x] Add automated test coverage for release packet generation behavior.


## Phase 20 — Android Release Packet Validation
- [x] Add schema validator for generated Android release packet artifact.
- [x] Wire Android release baseline workflow to validate packet before upload.
- [x] Add automated test coverage for packet validator pass/fail behavior.


## Phase 21 — Android Release Packet Integrity Hashing
- [x] Add SHA-256 checksums to generated Android release packet docs entries.
- [x] Validate release packet hashes against source launch/compliance docs.
- [x] Add automated test coverage for release packet hash mismatch behavior.


## Phase 22 — Android Release Packet Source Traceability
- [x] Capture source git revision in generated Android release packet artifacts.
- [x] Validate release packet source revision format during packet checks.
- [x] Add automated tests for invalid release packet source revision handling.


## Phase 23 — Android Release Packet CI SHA Binding
- [x] Bind release packet source revision validation to CI `github.sha`.
- [x] Add validator support for explicit expected source revision checks.
- [x] Add automated test coverage for source revision mismatch behavior.


## Phase 24 — Android Release Packet CI Run Traceability
- [x] Capture CI run metadata in generated Android release packet artifacts.
- [x] Validate CI run metadata format during release packet checks.
- [x] Add automated tests for malformed CI run metadata behavior.
