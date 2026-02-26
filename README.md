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
  - Users, Households, People
  - Goals, MacroTargets
  - Recipes, Ingredients, RecipeIngredients, RecipeNutritionSnapshots
  - MealPlans, MealPlanItems
  - ShoppingLists, ShoppingListItems
- Add unit/category metadata for ingredient normalization.
- Add indexes for week-based plan queries and recipe filtering.

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

### Phase 5: Weekly Planner Engine
- Define objective function and scoring:
  - Macro fit
  - Ingredient overlap
  - Preference fit (cuisine/meal type)
  - Prep/bulk-cook suitability
- Implement deterministic, seed-based plan generation.
- Separate hard vs soft constraints with fallback behavior.
- Add debug trace output for selection decisions.

### Phase 6: Shopping List Engine
- Aggregate scaled ingredients across household plans.
- Normalize units and consolidate duplicates.
- Group by category (produce/meat/dairy/pantry/spices).
- Add optional warehouse/bulk optimization mode.

### Phase 7: URL Recipe Import
- Build ingestion pipeline:
  - Fetch URL
  - Parse schema.org data
  - Parse ingredients + normalize units
  - Extract or estimate nutrition when missing
- Add import status tracking and error handling.
- Add deduplication via canonical URL + recipe hash heuristics.

### Phase 8: API, Auth, and Subscription Gates
- Implement authentication and household-scoped authorization.
- Define API contracts for setup, generation, swap/regenerate, shopping list.
- Add feature gates for free vs paid capabilities.
- Add idempotency and rate limits for heavy endpoints.

### Phase 9: UI Implementation
- Household setup flow (members + biological inputs + goals).
- Weekly review flow (macro visibility, swap/regenerate).
- Shopping list view (grouped list + export).

### Phase 10: Production Readiness & Deployment
- Add observability: structured logs, health checks, metrics, alerts.
- Deploy backend (Render/Railway) and frontend (Vercel).
- Configure secure environment variables and production DB.
- Define API versioning and compatibility to support future Android clients.

## Testing Strategy (Cross-Phase)
- Unit tests for rule engine and nutrition/macro calculations.
- Integration tests for plan generation and shopping aggregation.
- Contract tests for frontend/backend APIs.
- Coverage gate for core metabolic/planning modules.

## Repository Workflow Rules
- Follow the required branch/PR naming convention in `CONTRIBUTING.md`.
- Merge to `main` through Pull Requests only (no direct pushes).
- GitHub enforcement details live in `.github/workflows/pr-policy.yml` and `.github/BRANCH_PROTECTION.md`.
- Automation scripts for auth/PR creation live in `scripts/bootstrap_github_auth.sh` and `scripts/create_pr.sh`.
