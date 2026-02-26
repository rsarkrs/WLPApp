-- Phase 7 URL import expansion: attribution, status/error tracking, and dedupe keys.

CREATE TABLE IF NOT EXISTS recipe_import_jobs (
  id BIGSERIAL PRIMARY KEY,
  requested_url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  extraction_method TEXT NOT NULL CHECK (extraction_method IN ('schema_org', 'fallback_extractor')),
  status TEXT NOT NULL CHECK (status IN ('queued', 'fetching', 'parsed', 'normalized', 'mapped', 'imported', 'failed_validation', 'failed_fetch', 'failed_parse')),
  error_code TEXT,
  error_message TEXT,
  warning_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS canonical_source_url TEXT,
  ADD COLUMN IF NOT EXISTS source_domain TEXT,
  ADD COLUMN IF NOT EXISTS source_attribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS import_status TEXT NOT NULL DEFAULT 'manual' CHECK (import_status IN ('manual', 'imported', 'failed_validation', 'failed_parse')),
  ADD COLUMN IF NOT EXISTS import_error_code TEXT,
  ADD COLUMN IF NOT EXISTS import_error_message TEXT,
  ADD COLUMN IF NOT EXISTS normalized_name TEXT,
  ADD COLUMN IF NOT EXISTS recipe_content_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS recipes_canonical_source_url_unique
  ON recipes (canonical_source_url)
  WHERE canonical_source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS recipes_normalized_name_idx ON recipes (normalized_name);
CREATE INDEX IF NOT EXISTS recipes_recipe_content_hash_idx ON recipes (recipe_content_hash);
CREATE INDEX IF NOT EXISTS recipe_import_jobs_status_idx ON recipe_import_jobs (status);

-- Optional heuristic dedupe helper: pairs potential duplicates by content hash or normalized name.
CREATE MATERIALIZED VIEW IF NOT EXISTS recipe_possible_duplicates AS
SELECT
  r1.id AS recipe_id,
  r2.id AS duplicate_recipe_id,
  CASE
    WHEN r1.recipe_content_hash IS NOT NULL AND r1.recipe_content_hash = r2.recipe_content_hash THEN 'hash_match'
    WHEN r1.normalized_name IS NOT NULL AND r1.normalized_name = r2.normalized_name THEN 'normalized_name_match'
  END AS match_reason
FROM recipes r1
JOIN recipes r2 ON r1.id < r2.id
WHERE (
  r1.recipe_content_hash IS NOT NULL
  AND r1.recipe_content_hash = r2.recipe_content_hash
) OR (
  r1.normalized_name IS NOT NULL
  AND r1.normalized_name = r2.normalized_name
);
