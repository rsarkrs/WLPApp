const test = require('node:test');
const assert = require('node:assert/strict');

const { seedRecipes } = require('../../src/catalog/recipes');
const { planWeek, buildPlanningPreview } = require('../../src/planner/engine');

test('planner engine: deterministic output for same seed/input', () => {
  const first = planWeek({
    recipes: seedRecipes,
    seed: 42,
    days: 7,
    mealType: 'breakfast',
    cuisine: 'american',
    targetMacros: { proteinG: 30, fatG: 12, carbG: 45 },
  });

  const second = planWeek({
    recipes: seedRecipes,
    seed: 42,
    days: 7,
    mealType: 'breakfast',
    cuisine: 'american',
    targetMacros: { proteinG: 30, fatG: 12, carbG: 45 },
  });

  assert.deepEqual(first, second);
});

test('planner engine: fallback is set when macro error exceeds tolerance', () => {
  const result = planWeek({
    recipes: seedRecipes,
    seed: 1,
    days: 7,
    mealType: 'dinner',
    cuisine: 'asian',
    targetMacros: { proteinG: 300, fatG: 10, carbG: 10 },
  });

  assert.equal(result.fallbackApplied, true);
  assert.equal(result.fallbackReasonCode, 'ERR_MACRO_MATCH_NOT_FOUND');
});

test('planner engine: planning preview enforces safety constraints', () => {
  const preview = buildPlanningPreview({
    recipes: seedRecipes,
    seed: 7,
    days: 7,
    mealType: 'breakfast',
    cuisine: 'american',
    sex: 'female',
    dailyCalories: 1000,
    weightKg: 80,
    requestedWeeklyLossKg: 2,
  });

  assert.equal(preview.safety.calorie.finalDailyCalories, 1200);
  assert.equal(preview.safety.weeklyCap.approvedWeeklyLossKg, 0.8);
  assert.ok(preview.plan.debug.length >= 2);
});
