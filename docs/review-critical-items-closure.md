# Critical Review Closure: Roadmap + Schema + QA Alignment

This document closes the three critical planning items identified in the pre-execution review and records where each fix lives.

## 1) Roadmap phase numbering collisions

**Resolved:** The roadmap is now sequential and unique from **Phase 0** through **Phase 12**, with no duplicate phase numbers.

- Canonical roadmap source: `README.md`.
- Execution tracking should reference phase labels from this file only.

## 2) Schema plan drift on constraints and indexes

**Resolved:** Phase 2 conventions and migration SQL now both enforce and/or index the documented week-based keys and recipe filter access patterns.

- Canonical schema conventions: `db/schema.models.md`.
- Implemented migration constraints/indexes:
  - `shopping_lists (household_id, week_start_date)` uniqueness constraint.
  - `recipes (cuisine, meal_type)` composite index.
  - `shopping_lists (household_id, week_start_date)` supporting index.

## 3) QA documentation drift vs actual tests

**Resolved:** QA documentation now maps policy gates to concrete paths that exist in this repository and distinguishes current versus planned monorepo paths.

- QA gate mapping source: `docs/qa-phase.md`.
- Current tests explicitly mapped for:
  - Unit
  - Property/edge
  - Integration
  - API contract
- Planned future coverage paths remain documented separately to avoid policy confusion.

## Operational note

When reviewing future planning updates, validate these three dimensions together in a single PR:
1. `README.md` phase sequence and DoD language.
2. `db/schema.models.md` conventions and migration SQL parity.
3. `docs/qa-phase.md` gate-to-path mapping against current test files.
