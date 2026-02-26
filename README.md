# WLPApp

Constraint-based meal planning application focused on metabolic safety, macro adherence, household scaling, and unified shopping output.

## Revised Delivery Plan

### Phase 0: Domain Model & Rules Contract (Pre-DB)
- Publish a canonical contract package (types + validation + examples) that must be imported by all downstream services before schema/migration work starts.
- Define canonical entities and boundaries:
  - `User`: account identity, auth profile, timezone/locale preferences, and membership references to one or more households.
  - `Household`: collaboration boundary that owns members, goals, meal plans, and shopping lists.
  - `Person`: biologically relevant nutrition subject (sex, age, height, weight, activity), scoped to one household.
  - `Goal`: per-person target intent (maintenance, fat loss, gain) including desired rate and constraint preferences.
  - `Recipe`: immutable nutrition snapshot, ingredients, portions, and preparation metadata used for planning.
  - `MealPlan`: week-scoped assignment of recipes/servings to household persons with macro/calorie rollups.
  - `ShoppingList`: normalized aggregate of required ingredients generated from a meal plan.
- Define canonical relationships:
  - `User` ↔ `Household`: many-to-many membership via roles (`owner`, `member`).
  - `Household` → `Person`: one-to-many.
  - `Person` → `Goal`: one active goal + historical goals (one-to-many over time).
  - `MealPlan` → `Household`: many plans over time, each plan belongs to exactly one household.
  - `MealPlan` ↔ `Recipe`: many-to-many through plan items with per-person/per-day serving allocations.
  - `ShoppingList` → `MealPlan`: one generated list per plan version (regenerated lists are versioned).
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

### Phase 1: Core Infrastructure
- Create monorepo structure.
- Set up frontend (Next.js).
- Set up backend (Node.js + Express).
- Configure PostgreSQL and local dev environment.
- Add CI pipeline scaffold (lint, test, build).

### Phase 2: Data Model & Migrations
- Implement schema for:
  - Users, Households, HouseholdMembers, People
  - Goals, MacroTargets
  - Recipes, Ingredients, RecipeIngredients, RecipeNutritionSnapshots
  - MealPlans, MealPlanItems
  - ShoppingLists, ShoppingListItems
  - PlanningRuns, RuleExecutionArtifacts (rule-evaluation and fallback traces)
- Add unit/category metadata and normalization fields for ingredients.
- Add household/member linking with role and ownership metadata.
- Add soft-delete and created/updated timestamps for core entities.
- Add explicit indexes for household week-based plan queries and recipe filtering by cuisine/meal type.

### Phase 3: Calorie & Macro Engine
- Implement BMR/TDEE with unit conversions and activity multipliers.
- Implement deficit logic with daily conversion and 1% weekly cap.
- Enforce calorie floors.
- Implement macro calculation (protein/fat/carb strategy).
- Add unit + edge-case tests for all constraint logic.

### Phase 4: Recipe Catalog & Filtering
- Seed initial structured recipe set with cuisine/meal-type/macro metadata.
- Implement filters: cuisine, ingredient inclusion/exclusion, meal type.
- Add validation checks for recipe completeness and normalization.

### Phase 5A: Weekly Planner Algorithm Design
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

### Phase 5B: Weekly Planner Engine Implementation
- Implement deterministic, seed-based plan generation for reproducible plans.
- Implement hard-constraint filtering + soft-constraint scoring execution.
- Implement macro-match fallback logic from the algorithm design.
- Add planner debug output for why meals were selected or rejected.

### Phase 6: Shopping List Engine
- Aggregate scaled ingredients across household plans.
- Normalize units and consolidate duplicates.
- Group by category (produce/meat/dairy/pantry/spices).
- Add optional warehouse/bulk optimization mode.

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

### Phase 10: Dedicated QA & Release Readiness
- Enforce pre-deployment QA gate for every release candidate.
- Add unit tests for BMR/TDEE calculations, deficit-cap enforcement, calorie floors, and macro split logic.
- Add property and edge-case tests for extreme physiological input ranges and aggressive goals.
- Add integration tests for weekly plan generation and shopping-list aggregation behavior.
- Add API contract tests validating frontend/backend request-response compatibility.
- Enforce CI coverage thresholds for core engine modules before deployment.

### Phase 11: Production Readiness & Deployment
- Add observability: structured logs, health checks, metrics, alerts.
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
