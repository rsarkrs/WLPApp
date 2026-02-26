# Dedicated QA Phase (Pre-Deployment)

This document defines the required quality gate that must pass before any deployment workflow executes.

## Scope
The QA phase is mandatory for release branches and pull requests targeting `main`.

## Test Layers

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
Coverage checks for core engine modules are required. Minimum thresholds:

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
