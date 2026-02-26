-- Adds ingredient normalization metadata, ownership metadata, soft delete/timestamps, and query indexes.

ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS default_unit TEXT,
  ADD COLUMN IF NOT EXISTS normalization_group TEXT,
  ADD COLUMN IF NOT EXISTS normalization_factor_to_base NUMERIC(12,6),
  ADD COLUMN IF NOT EXISTS normalization_base_unit TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE household_members
  ADD COLUMN IF NOT EXISTS role TEXT,
  ADD COLUMN IF NOT EXISTS is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS linked_member_id UUID REFERENCES household_members(id),
  ADD COLUMN IF NOT EXISTS owner_member_id UUID REFERENCES household_members(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

UPDATE household_members
SET role = 'member'
WHERE role IS NULL;

ALTER TABLE household_members
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE household_members
  DROP CONSTRAINT IF EXISTS household_members_role_check;

ALTER TABLE household_members
  ADD CONSTRAINT household_members_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

CREATE INDEX IF NOT EXISTS idx_meal_plans_household_week
  ON meal_plans (household_id, week_start_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_meal_plan_items_plan_date
  ON meal_plan_items (meal_plan_id, planned_for)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_shopping_lists_household_week
  ON shopping_lists (household_id, week_start_date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_meal_type
  ON recipes (cuisine, meal_type)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rule_execution_artifacts_run_rule
  ON rule_execution_artifacts (planning_run_id, rule_name);
