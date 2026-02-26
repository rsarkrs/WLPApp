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

## Rule-execution artifacts
- `rule_execution_runs`
- `rule_execution_events`

## Design conventions
- Soft delete on core records via `deleted_at`.
- Auditing timestamps on core records via `created_at` and `updated_at`.
- Week-based planning keys: `meal_plans (household_id, week_start_date)` and `shopping_lists (household_id, week_start_date)`.
- Recipe filters index: `recipes (cuisine, meal_type)`.
