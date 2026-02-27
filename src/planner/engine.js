const { filterRecipes } = require('../catalog/recipes');
const { applyWeeklyCap, applyCalorieFloor, allocateMacros } = require('../domain/metabolicEngine');

function seededIndex(seed, index, size) {
  const value = (Number(seed) + index * 9973) % size;
  return value < 0 ? value + size : value;
}

function macroError(target, actual) {
  return Math.abs((target.proteinG || 0) - (actual.proteinG || 0))
    + Math.abs((target.fatG || 0) - (actual.fatG || 0))
    + Math.abs((target.carbG || 0) - (actual.carbG || 0));
}

function planWeek({ recipes, seed = 0, days = 7, mealType, cuisine, targetMacros }) {
  const filtered = filterRecipes(recipes, { mealType, cuisine });

  if (filtered.length === 0) {
    return {
      meals: [],
      fallbackApplied: true,
      fallbackReasonCode: 'ERR_NO_RECIPES_MATCH_FILTERS',
      debug: [{ step: 'filter', details: { mealType, cuisine, matchedCount: 0 } }],
    };
  }

  const meals = [];
  for (let i = 0; i < days; i += 1) {
    const idx = seededIndex(seed, i, filtered.length);
    const recipe = filtered[idx];
    meals.push({
      day: i + 1,
      recipeId: recipe.id,
      recipeName: recipe.name,
      macros: recipe.macros,
      selectionReason: `seeded_index_${idx}`,
    });
  }

  const aggregate = meals.reduce(
    (acc, item) => {
      acc.proteinG += item.macros.proteinG || 0;
      acc.fatG += item.macros.fatG || 0;
      acc.carbG += item.macros.carbG || 0;
      return acc;
    },
    { proteinG: 0, fatG: 0, carbG: 0 }
  );

  const average = {
    proteinG: Math.round(aggregate.proteinG / days),
    fatG: Math.round(aggregate.fatG / days),
    carbG: Math.round(aggregate.carbG / days),
  };

  const error = macroError(targetMacros, average);
  const tolerance = 18;

  return {
    meals,
    averageMacros: average,
    macroError: error,
    fallbackApplied: error > tolerance,
    fallbackReasonCode: error > tolerance ? 'ERR_MACRO_MATCH_NOT_FOUND' : null,
    debug: [
      { step: 'filter', details: { mealType, cuisine, matchedCount: filtered.length } },
      { step: 'macro_evaluation', details: { error, tolerance } },
    ],
  };
}

function buildPlanningPreview({ recipes, seed = 0, days = 7, mealType, cuisine, sex, dailyCalories, weightKg, requestedWeeklyLossKg }) {
  const calorie = applyCalorieFloor({ sex, proposedDailyCalories: dailyCalories });
  const weeklyCap = applyWeeklyCap({ currentWeightKg: weightKg, requestedWeeklyLossKg });
  const targetMacros = allocateMacros({ dailyCalories: calorie.finalDailyCalories, weightKg });

  const plan = planWeek({ recipes, seed, days, mealType, cuisine, targetMacros });

  return {
    plan,
    safety: {
      calorie,
      weeklyCap,
      targetMacros,
    },
  };
}

module.exports = {
  seededIndex,
  planWeek,
  buildPlanningPreview,
};
