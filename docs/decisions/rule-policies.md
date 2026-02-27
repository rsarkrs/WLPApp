# Rule Policy Decisions

This decision log defines implementation-safe policy rules for metabolic contracts and adapters.

## Decision Register

| ID | Topic | Status | Owner | Due date |
|---|---|---|---|---|
| RP-001 | Activity multiplier table and source authority | ✅ Approved | Nutrition Engine (Domain Rules) | 2026-03-04 |
| RP-002 | Rounding precedence (intermediate vs final values) | ✅ Approved | Nutrition Engine (Domain Rules) | 2026-03-04 |
| RP-003 | Age support policy and error behavior | ✅ Approved | Nutrition Engine (Domain Rules) + API Platform | 2026-03-04 |
| RP-004 | Canonical unit system and conversion tolerances | ✅ Approved | Nutrition Engine (Domain Rules) + Shopping/Import Domain | 2026-03-15 |

---

## RP-001 — Activity multiplier table values and source authority

- **Status:** ✅ Approved
- **Owner:** Nutrition Engine (Domain Rules)
- **Due date:** 2026-03-04

### Approved policy
Use the following activity multipliers as canonical contract values:

| activityLevel | multiplier |
|---|---:|
| sedentary | 1.2 |
| light | 1.375 |
| moderate | 1.55 |
| very | 1.725 |

### Source authority hierarchy
1. Contract fixture metadata (`tests/fixtures/metabolic-contract-fixtures.json`) is authoritative for the current repository phase.
2. Contract adapters/reference implementation (`tests/qa/support/metabolic-contract.js`) must consume and apply that table directly.
3. Downstream services must import generated/shared contract artifacts; inline re-definition is non-compliant.

### Rationale
The table is already used in fixture metadata and validated by QA contract tests, so approving these values prevents drift across services.

---

## RP-002 — Rounding precedence (intermediate vs final values)

- **Status:** ✅ Approved
- **Owner:** Nutrition Engine (Domain Rules)
- **Due date:** 2026-03-04

### Approved policy
Default rounding precedence is:
1. Keep intermediate values at full precision.
2. Apply rounding at contract output boundaries.
3. Use `Math.round(value)` (`nearest_integer_half_up`) unless a formula-specific exception is explicitly versioned in the contract.

### Current contract application map
| Output area | Intermediate rounding | Final rounding |
|---|---|---|
| BMR/TDEE (`bmrRaw`, `tdeeRaw`) | None | `Math.round` on exposed kcal outputs |
| Macro allocation grams | Formula-level rounding where defined by contract logic | Returned integer gram values remain as computed |

### Rationale
This aligns with fixture metadata and the contract reference implementation, and avoids cumulative error from premature rounding.

---

## RP-003 — Age support policy and error behavior

- **Status:** ✅ Approved
- **Owner:** Nutrition Engine (Domain Rules) + API Platform
- **Due date:** 2026-03-04

### Approved policy
Default BMR/TDEE contract mode supports adults only:
- `ageYears >= 18` is required.

If input violates the rule:
- Return `ERR_INVALID_AGE`
- Return exact message: `ageYears must be >= 18.`

### Compatibility requirement
Error codes/messages are contract surface area and must remain exact across API, engine, and tests unless changed via explicit contract version update.

### Rationale
Adult-only support and exact error behavior are already codified in fixtures and QA tests.

---

## RP-004 — Canonical unit system and conversion tolerances

- **Status:** ✅ Approved
- **Owner:** Nutrition Engine (Domain Rules) + Shopping/Import Domain
- **Due date:** 2026-03-15

### Approved policy
Canonical units for metabolic-core rules:
- weight: kilograms (`kg`)
- height: centimeters (`cm`)
- energy: kilocalories (`kcal`)

Adapter behavior:
- Public adapters may accept canonical metric payloads directly and may optionally accept imperial payloads when explicit unit fields are provided.
- Core rule modules must receive canonical metric units only.
- Conversion is adapter-only responsibility; core metabolic logic must never branch on imperial units.

### Approved conversion constants
- `lb_to_kg = 0.45359237`
- `in_to_cm = 2.54`

### Approved tolerance and assertion policy
1. Conversions keep full floating precision through intermediate calculations.
2. Contract output rounding policy from RP-002 applies at output boundaries.
3. Test assertions for converted intermediate values use absolute tolerance `<= 0.0001` before final output rounding.
4. Final public outputs must satisfy contract fixture exactness after rounding.

### Approved error behavior
- Unknown/unsupported unit label: `ERR_UNSUPPORTED_UNIT` with message `Unsupported unit for {field}.`
- Missing required unit for non-canonical payload: `ERR_MISSING_UNIT` with message `Unit is required for {field}.`
- Incompatible unit for field (e.g., inches for weight): `ERR_INCOMPATIBLE_UNIT` with message `Incompatible unit for {field}.`

### Compatibility requirement
These error codes/messages and constants are contract surface area and must remain stable unless changed via explicit contract version update.
