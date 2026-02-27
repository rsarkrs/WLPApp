---
name: wlp-recipe-import-hardener
description: Safely evolve the recipe URL ingestion pipeline (schema.org parsing, normalization, fallback, dedupe, nutrition mapping). Use when modifying src/recipeImport.
---

# WLP Recipe Import Hardener

## Workflow
1. Identify pipeline stage touched: fetch, parse, normalize, nutrition, fallback, dedupe.
2. Add/adjust focused tests in `src/recipeImport/pipeline.test.js`.
3. Preserve deterministic dedupe keys and source attribution behavior.
4. Re-run `npm run test:unit` and relevant QA checks.

## Guardrails
- Fallback extraction should only activate when structured data is absent/malformed.
- Validation failures must return explicit errors/warnings.
