# Dedicated QA Phase (Pre-Deployment)

This document defines the required quality gate that must pass before any deployment workflow executes.

## Scope
The QA phase is mandatory for release branches and pull requests targeting `main`.

## Test Layers

### Current Source Path Mapping (for CI policy wiring)

| QA gate / layer | Current concrete path(s) | Status | Notes for CI implementation |
| --- | --- | --- | --- |
| Unit tests (metabolic + macro engine) | `tests/qa/metabolic-engine.test.js` | Implemented | Use as the current unit gate target until engine modules are split into dedicated packages. |
| Property + edge tests | `tests/qa/metabolic-engine.property.test.js`, `tests/qa/metabolic-engine.test.js` | Implemented | Current property coverage exists in a dedicated property test file; consider adding fuzz/stochastic extensions in monorepo split. |
| Integration tests | `tests/qa/planning-shopping.integration.test.js`, `tests/qa/app-scaffolds.integration.test.js` | Implemented | Covers planning/shopping plus scaffold/API integration surfaces. |
| API contract tests | `tests/qa/api-contract.test.js`, `tests/qa/support/metabolic-contract.js`, `tests/fixtures/metabolic-contract-fixtures.json` | Implemented | Treat fixtures + shared contract helper as part of contract gate inputs. |
| Coverage gate paths | `src/domain/metabolicEngine.js`, `src/planner/engine.js`, `src/shopping/consolidation.js` via `npm run coverage:engine` | Implemented | Enforced in CI with per-module thresholds before full-suite coverage check. |

### Layer-to-Test File Coverage

| Layer | Test file(s) currently satisfying layer |
| --- | --- |
| Unit | `tests/qa/metabolic-engine.test.js` |
| Property / edge | `tests/qa/metabolic-engine.property.test.js`, `tests/qa/metabolic-engine.test.js` |
| Integration | `tests/qa/planning-shopping.integration.test.js`, `tests/qa/app-scaffolds.integration.test.js` |
| Contract | `tests/qa/api-contract.test.js`, `tests/qa/support/metabolic-contract.js`, `tests/fixtures/metabolic-contract-fixtures.json` |

### Monorepo Transition Note (Path Renames Expected)

During monorepo setup, test and coverage paths are expected to move from the current flat layout (`tests/qa/**`) into package-scoped locations (for example, `packages/core-metabolic/tests/**`, `packages/core-planning/tests/**`, and `packages/core-shopping/tests/**`). CI policy should therefore:

1. Use the concrete paths in this document today.
2. Enforce current core engine coverage at `src/domain/metabolicEngine.js`, `src/planner/engine.js`, and `src/shopping/consolidation.js` via `npm run coverage:engine` and keep `core/*` paths as planned monorepo targets.
3. Update gate path globs in the same PR that introduces package path moves to avoid silent gate bypass.

### 1) Unit Tests (Metabolic & Macro Engine)
Add and maintain unit tests for:
- BMR/TDEE calculations (Mifflin-St Jeor + activity multipliers)
- Weekly deficit cap enforcement (max 1% bodyweight/week)
- Sex-based calorie floors (female >= 1200, male >= 1600)
- Macro split logic (protein/fat/carb allocation and fallback)

### 2) Property + Edge Tests
Add robust edge/property coverage for extreme inputs:
- Very low and very high body weight boundaries
- Age boundary conditions (minimum and upper supported range)
- Aggressive goals that would violate deficit caps/floors
- Unit-conversion edge values (metric/imperial boundaries)

### 3) Integration Tests
Add integration tests to validate system behavior across modules:
- Weekly planning generation with deterministic seed behavior
- Shopping-list aggregation across household members
- Ingredient merge + normalization when duplicate ingredients appear

### 4) API Contract Tests
Add contract tests for frontend/backend interfaces:
- Request schema validation for planning and shopping endpoints
- Response shape and semantic field validation for all client-consumed payloads
- Error contract validation (status code + error body format)

## CI Coverage Gates
Coverage checks for core engine modules are required. Current enforced thresholds:

- `src/domain/metabolicEngine.js`: 90% line, 85% branch (`npm run coverage:engine`)
- `src/planner/engine.js`: 85% line, 80% branch (`npm run coverage:engine`)
- `src/shopping/consolidation.js`: 85% line, 80% branch (`npm run coverage:engine`)
- Full QA suite execution remains required via `npm run coverage:check`

Planned monorepo targets (to be enforced when paths exist):
- `core/metabolic/**`: 90% line, 90% branch
- `core/planning/**`: 85% line, 80% branch
- `core/shopping/**`: 85% line, 80% branch
- Global minimum: 85% line, 80% branch

If thresholds are not met, deployment jobs must not run.

## Pipeline Ordering
1. Lint/typecheck
2. Unit + property/edge tests
3. Integration tests
4. API contract tests
5. Coverage gate verification
6. Build artifacts
7. Deploy (only if all prior steps pass)
