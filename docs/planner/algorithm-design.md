# Phase 5A — Weekly Planner Algorithm Design

## Objective Function

Planner scores each candidate weekly plan with a weighted sum:

`score = 0.45 * macroFit + 0.20 * ingredientReuse + 0.20 * preferenceFit + 0.15 * prepEfficiency`

### Metric definitions
- **macroFit (0-100)**: inverse normalized error against daily macro targets across all planned meals.
- **ingredientReuse (0-100)**: reward for overlap in ingredients to reduce shopping fragmentation.
- **preferenceFit (0-100)**: reward for satisfying cuisine and meal-type preferences.
- **prepEfficiency (0-100)**: reward for plans favoring lower prep effort and optional batch-cook patterns.

## Constraint Taxonomy

### Hard constraints (must pass)
1. Daily calories must respect floor policy (female >= 1200, male >= 1600).
2. Weekly loss request must be clamped to <= 1% bodyweight/week.
3. Excluded ingredients must not appear in selected meals.
4. Meal count must match required slots per day.

### Soft constraints (optimize)
1. Minimize macro deviation (protein/fat/carb targets).
2. Maximize ingredient reuse across the week.
3. Favor requested cuisines and meal types.
4. Favor lower prep-time candidates when scores are close.

## Tie-break Determinism

When two candidates have equal rounded score at 3 decimals:
1. Select the candidate with lower total macro error.
2. If still tied, select higher ingredient reuse.
3. If still tied, pick lexical-minimum tuple of recipe IDs.

This guarantees deterministic output with a fixed seed and identical inputs.

## Fallback Behavior

If no candidate satisfies all hard constraints with macro error <= tolerance:
1. Keep all hard constraints enforced.
2. Relax macro tolerance in bounded increments (+2% up to +10%).
3. Mark plan metadata:
   - `fallbackApplied: true`
   - `fallbackReasonCode: 'ERR_MACRO_MATCH_NOT_FOUND'`
   - `relaxationLevelPct` with applied tolerance increase.

## Traceability to tests
- Determinism: integration test should assert byte-equivalent output for identical seed/input.
- Constraint safety: unit/integration tests should prove calorie floor + weekly cap are never violated.
- Tie-break: unit tests should include synthetic equal-score plans and assert lexical recipe ID tie-break.
- Fallback: integration tests should verify fallback metadata is set when strict macro match is infeasible.
