# WLPApp

Constraint-based meal planning application focused on metabolic safety, macro adherence, household scaling, and unified shopping output.

## Revised Delivery Plan

### Phase 0: Domain Contracts & Rule Definitions
- Define canonical entities: `User`, `Household`, `Person`, `Goal`, `Recipe`, `MealPlan`, `ShoppingList`.
- Define hard constraints:
  - Mifflin-St Jeor BMR/TDEE calculation contract
  - Weekly fat-loss cap (<= 1% bodyweight/week)
  - Calorie floors (female >= 1200 kcal, male >= 1600 kcal)
- Define macro allocation strategy and fallback behavior.
- Add acceptance criteria examples for all core rule paths.

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
