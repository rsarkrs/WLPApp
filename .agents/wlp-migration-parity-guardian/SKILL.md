---
name: wlp-migration-parity-guardian
description: Keep schema docs and SQL migrations aligned, including naming and index/constraint parity. Use when editing db/schema.models.md or database/migrations.
---

# WLP Migration Parity Guardian

## Workflow
1. Treat `db/schema.models.md` as canonical naming source.
2. Compare planned conventions vs migration SQL for parity.
3. Check index/constraint ordering across sequential migrations.
4. Validate partial-index intent (`WHERE deleted_at IS NULL`) is preserved.
5. Update closure/decision docs if implementation location changes.

## Guardrails
- Avoid duplicate indexes that shadow later partial indexes.
- Keep migration comments concise and model-reference oriented.
