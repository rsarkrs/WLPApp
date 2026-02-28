const test = require('node:test');
const assert = require('node:assert/strict');

const { seedRecipes } = require('../../src/catalog/recipes');
const { seededIndex, planWeek, buildPlanningPreview } = require('../../src/planner/engine');

test('planner engine: seededIndex remains in-bounds for negative seeds', () => {
  const idx = seededIndex(-41, 2, 3);
  assert.ok(idx >= 0 && idx < 3);
});

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
    cuisine: 'korean',
    targetMacros: { proteinG: 300, fatG: 10, carbG: 10 },
  });

  assert.equal(result.fallbackApplied, true);
  assert.equal(result.fallbackReasonCode, 'ERR_MACRO_MATCH_NOT_FOUND');
});

test('planner engine: returns no-results fallback when filters remove all recipes', () => {
  const result = planWeek({
    recipes: seedRecipes,
    seed: 1,
    days: 7,
    mealType: 'snack',
    cuisine: 'not-a-cuisine',
    targetMacros: { proteinG: 30, fatG: 12, carbG: 45 },
  });

  assert.equal(result.meals.length, 0);
  assert.equal(result.fallbackApplied, true);
  assert.equal(result.fallbackReasonCode, 'ERR_NO_RECIPES_MATCH_FILTERS');
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


test('planner engine: include and exclude ingredient preferences are applied', () => {
  const result = buildPlanningPreview({
    recipes: seedRecipes,
    seed: 3,
    days: 3,
    cuisine: 'chinese,korean',
    includeIngredient: 'rice',
    excludeIngredient: 'cheese',
    sex: 'female',
    dailyCalories: 1600,
    weightKg: 70,
    requestedWeeklyLossKg: 0.4,
  });

  assert.ok(result.plan.days.length > 0);
  for (const day of result.plan.days) {
    for (const meal of day.meals) {
      const recipe = seedRecipes.find((item) => item.id === meal.recipeId);
      assert.ok(['chinese', 'korean'].includes(recipe.cuisine));
      const ingredients = recipe.ingredients.map((item) => item.name.toLowerCase());
      assert.ok(ingredients.includes('rice'));
      assert.equal(ingredients.includes('cheese'), false);
    }
  }
});
