# Schema Models: Planning + Rule Execution

This model set extends the Phase 2 schema-design task with planning artifacts, household ownership/member roles, nutrition snapshots, and soft-delete support.

## Core entities
- `users`
- `households`
- `people`
- `household_members` (household↔user link with role + owner flags)

## Goal and macro entities
- `goals`
- `macro_targets`

## Recipe and ingredient entities
- `recipes`
- `ingredients` (unit/category + normalization metadata)
- `recipe_ingredients`
- `recipe_nutrition_snapshots`

## Planning and shopping entities
- `meal_plans`
- `meal_plan_items`
- `shopping_lists`
- `shopping_list_items`

## Planning and rule-engine entities
- `planning_runs` (business-level planner invocation for a household/week)
- `rule_execution_artifacts` (rule-engine-level events emitted within a planning run)

## Terminology rationale (canonical)
- We use **`planning_runs`** for the top-level business process: a user/system-triggered weekly plan generation attempt.
- We use **`rule_execution_artifacts`** for lower-level rule-engine outputs (constraint checks, fallbacks, rejections, scoring details) produced during a planning run.
- This separation keeps future migrations explicit about intent: business run lifecycle changes belong to `planning_runs`, while rule trace detail evolution belongs to `rule_execution_artifacts`.

## Design conventions
- Soft delete on core records via `deleted_at`.
- Auditing timestamps on core records via `created_at` and `updated_at`.
- Week-based planning keys: `meal_plans (household_id, week_start_date)` and `shopping_lists (household_id, week_start_date)`.
- Recipe filters index: `recipes (cuisine, meal_type)`.
