-- Schema reference: db/schema.models.md (authoritative model spec).
-- Migration adds planning/rule-execution artifacts; keep comments concise and implementation-focused.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  person_id UUID NOT NULL REFERENCES people(id),
  goal_type TEXT NOT NULL CHECK (goal_type IN ('fat_loss', 'maintenance', 'muscle_gain', 'custom')),
  start_date DATE NOT NULL,
  end_date DATE,
  target_weight_kg NUMERIC(6,2),
  target_delta_kg_per_week NUMERIC(5,2),
  notes TEXT,
  created_by_member_id UUID REFERENCES household_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS macro_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  person_id UUID NOT NULL REFERENCES people(id),
  goal_id UUID REFERENCES goals(id),
  calories_kcal INTEGER NOT NULL,
  protein_g NUMERIC(7,2) NOT NULL,
  fat_g NUMERIC(7,2) NOT NULL,
  carbs_g NUMERIC(7,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  source TEXT NOT NULL CHECK (source IN ('system', 'manual', 'rule_engine')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS recipe_nutrition_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  calories_kcal NUMERIC(9,2) NOT NULL,
  protein_g NUMERIC(9,2) NOT NULL,
  fat_g NUMERIC(9,2) NOT NULL,
  carbs_g NUMERIC(9,2) NOT NULL,
  fiber_g NUMERIC(9,2),
  sodium_mg NUMERIC(10,2),
  snapshot_source TEXT NOT NULL CHECK (snapshot_source IN ('imported', 'estimated', 'manual')),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  week_start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'finalized', 'archived')),
  generated_from_run_id UUID,
  created_by_member_id UUID REFERENCES household_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (household_id, week_start_date)
);

CREATE TABLE IF NOT EXISTS meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
  person_id UUID NOT NULL REFERENCES people(id),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  meal_type TEXT NOT NULL,
  servings NUMERIC(7,2) NOT NULL,
  planned_for DATE NOT NULL,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  meal_plan_id UUID REFERENCES meal_plans(id),
  week_start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'completed', 'archived')),
  created_by_member_id UUID REFERENCES household_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  recipe_id UUID REFERENCES recipes(id),
  quantity NUMERIC(12,4) NOT NULL,
  unit TEXT NOT NULL,
  normalized_quantity NUMERIC(12,4),
  normalized_unit TEXT,
  category TEXT,
  purchased BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Canonical terminology: planning_runs is the business-level planner invocation.
CREATE TABLE IF NOT EXISTS planning_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  week_start_date DATE NOT NULL,
  initiated_by_member_id UUID REFERENCES household_members(id),
  deterministic_seed TEXT,
  objective_score NUMERIC(10,4),
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  rule_trace JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_plans_generated_from_run_fkey'
  ) THEN
    ALTER TABLE meal_plans
      ADD CONSTRAINT meal_plans_generated_from_run_fkey
      FOREIGN KEY (generated_from_run_id) REFERENCES planning_runs(id);
  END IF;
END $$;

-- Canonical terminology: rule_execution_artifacts captures rule-engine-level events within a planning run.
CREATE TABLE IF NOT EXISTS rule_execution_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planning_run_id UUID NOT NULL REFERENCES planning_runs(id),
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('constraint_evaluation', 'fallback_application', 'recipe_rejection', 'scoring_breakdown')),
  rule_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'hard_fail')),
  payload JSONB NOT NULL,
  emitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
