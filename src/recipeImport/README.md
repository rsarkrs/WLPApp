# Recipe URL Ingestion Pipeline

This module implements the Phase 7 URL import flow as a deterministic sequence:

1. **fetch**: fetch recipe HTML from the source URL.
2. **schema.org parse**: extract `Recipe` nodes from JSON-LD.
3. **ingredient normalization**: parse quantity + unit and map aliases.
4. **nutrition mapping**: map structured nutrition or estimate from normalized ingredients.

## Dedupe strategy

Dedupe keys are produced via:

- Canonical URL (tracking parameters and fragments stripped).
- Normalized recipe name (lower-cased, stopwords removed).
- Content hash (name + normalized ingredients + instructions).

## Validation

Validation enforces required fields (`name`, `ingredients`, `instructions`) and checks ingredient quantities/units.

## Fallback extraction

If schema.org data is absent, a fallback extractor uses title/list/paragraph heuristics.

## Output

`ingestRecipeFromUrl()` returns:

- `importStatus`
- `errors` and `warnings`
- `sourceAttribution`
- `dedupe` keys
- normalized `recipe` payload
