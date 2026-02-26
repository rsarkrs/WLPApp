BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Optional normalized values can use lookup tables in application code; text + checks keeps migration portable.

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  sex TEXT CHECK (sex IN ('female', 'male', 'other')),
  birth_date DATE,
  height_cm NUMERIC(6,2),
  weight_kg NUMERIC(6,2),
  activity_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by_user_id UUID REFERENCES users(id),
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (household_id, user_id)
);

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  person_id UUID NOT NULL REFERENCES people(id),
  created_by_user_id UUID NOT NULL REFERENCES users(id),
  goal_type TEXT NOT NULL CHECK (goal_type IN ('fat_loss', 'maintenance', 'muscle_gain', 'recomp')),
  start_date DATE NOT NULL,
  end_date DATE,
  target_weight_kg NUMERIC(6,2),
  weekly_weight_change_kg NUMERIC(5,2),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE macro_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id),
  person_id UUID NOT NULL REFERENCES people(id),
  calories_kcal INTEGER NOT NULL,
  protein_g INTEGER NOT NULL,
  fat_g INTEGER NOT NULL,
  carbs_g INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('rule_engine', 'manual_override')),
  rule_execution_run_id UUID,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id),
  created_by_user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  cuisine TEXT,
  meal_type TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  source_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  normalized_name TEXT NOT NULL,
  category TEXT NOT NULL,
  base_unit TEXT NOT NULL,
  default_unit TEXT,
  normalization_factor NUMERIC(12,6),
  normalization_source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  quantity NUMERIC(10,3) NOT NULL,
  unit TEXT NOT NULL,
  normalized_quantity NUMERIC(12,4),
  normalized_unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE recipe_nutrition_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  snapshot_source TEXT NOT NULL CHECK (snapshot_source IN ('imported', 'estimated', 'manual', 'computed')),
  calories_kcal INTEGER,
  protein_g NUMERIC(8,2),
  fat_g NUMERIC(8,2),
  carbs_g NUMERIC(8,2),
  fiber_g NUMERIC(8,2),
  sodium_mg NUMERIC(10,2),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  goal_id UUID REFERENCES goals(id),
  week_start_date DATE NOT NULL,
  generated_by_user_id UUID REFERENCES users(id),
  generation_seed TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'approved', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE (household_id, week_start_date)
);

CREATE TABLE meal_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES meal_plans(id),
  person_id UUID REFERENCES people(id),
  recipe_id UUID NOT NULL REFERENCES recipes(id),
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  servings NUMERIC(8,2) NOT NULL DEFAULT 1,
  scaled_servings NUMERIC(8,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  meal_plan_id UUID REFERENCES meal_plans(id),
  week_start_date DATE NOT NULL,
  generated_by_user_id UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id),
  ingredient_id UUID REFERENCES ingredients(id),
  item_name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC(10,3),
  unit TEXT,
  normalized_quantity NUMERIC(12,4),
  normalized_unit TEXT,
  purchased BOOLEAN NOT NULL DEFAULT FALSE,
  source_recipe_id UUID REFERENCES recipes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE rule_execution_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id),
  meal_plan_id UUID REFERENCES meal_plans(id),
  rule_set_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  diagnostics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE macro_targets
  ADD CONSTRAINT fk_macro_targets_rule_execution
  FOREIGN KEY (rule_execution_run_id) REFERENCES rule_execution_runs(id);

CREATE TABLE rule_execution_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_execution_run_id UUID NOT NULL REFERENCES rule_execution_runs(id),
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('debug', 'info', 'warning', 'error')),
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query paths.
CREATE INDEX idx_meal_plans_household_week
  ON meal_plans (household_id, week_start_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_shopping_lists_household_week
  ON shopping_lists (household_id, week_start_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_meal_plan_items_plan_date
  ON meal_plan_items (meal_plan_id, meal_date)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_recipes_cuisine_meal_type
  ON recipes (cuisine, meal_type)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_recipe_ingredients_recipe
  ON recipe_ingredients (recipe_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_rule_execution_runs_household_started
  ON rule_execution_runs (household_id, started_at DESC)
  WHERE deleted_at IS NULL;

COMMIT;
