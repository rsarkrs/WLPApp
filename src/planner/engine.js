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

function flattenDays(days) {
  return days.flatMap((day) => day.meals);
}

function summarizeMacros(meals, divisor) {
  const aggregate = meals.reduce(
    (acc, item) => {
      acc.proteinG += item.macros.proteinG || 0;
      acc.fatG += item.macros.fatG || 0;
      acc.carbG += item.macros.carbG || 0;
      return acc;
    },
    { proteinG: 0, fatG: 0, carbG: 0 }
  );

  return {
    proteinG: Math.round(aggregate.proteinG / divisor),
    fatG: Math.round(aggregate.fatG / divisor),
    carbG: Math.round(aggregate.carbG / divisor),
  };
}

function planWeek({ recipes, seed = 0, days = 7, mealType, cuisine, includeIngredient, excludeIngredient, targetMacros }) {
  const filtered = filterRecipes(recipes, { mealType, cuisine, includeIngredient, excludeIngredient });

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
      slot: mealType || 'meal',
      recipeId: recipe.id,
      recipeName: recipe.name,
      macros: recipe.macros,
      selectionReason: `seeded_index_${idx}`,
    });
  }

  const average = summarizeMacros(meals, days);
  const error = macroError(targetMacros, average);
  const tolerance = 18;

  return {
    meals,
    days: meals.map((meal) => ({ day: meal.day, meals: [meal] })),
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

function planWeekByMeals({ recipes, seed = 0, days = 7, cuisine, includeIngredient, excludeIngredient, targetMacros }) {
  const slots = ['breakfast', 'lunch', 'dinner'];
  const daysResult = [];
  const debug = [];

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayMeals = [];
    for (const [slotIndex, slot] of slots.entries()) {
      const filtered = filterRecipes(recipes, { mealType: slot, cuisine, includeIngredient, excludeIngredient });
      const slotPool = filtered.length > 0
        ? filtered
        : filterRecipes(recipes, { mealType: slot, includeIngredient, excludeIngredient });

      if (slotPool.length === 0) {
        debug.push({ step: 'filter', details: { slot, cuisine, matchedCount: 0, day: dayIndex + 1, fallbackToAnyCuisine: false } });
        continue;
      }

      if (filtered.length === 0) {
        debug.push({ step: 'filter', details: { slot, cuisine, matchedCount: 0, day: dayIndex + 1, fallbackToAnyCuisine: true } });
      }

      const idx = seededIndex(seed + slotIndex * 31, dayIndex, slotPool.length);
      const recipe = slotPool[idx];
      dayMeals.push({
        day: dayIndex + 1,
        slot,
        recipeId: recipe.id,
        recipeName: recipe.name,
        macros: recipe.macros,
        selectionReason: `seeded_index_${idx}`,
      });

      debug.push({ step: 'filter', details: { slot, cuisine, matchedCount: slotPool.length, day: dayIndex + 1 } });
    }

    daysResult.push({ day: dayIndex + 1, meals: dayMeals });
  }

  const meals = flattenDays(daysResult);
  const average = summarizeMacros(meals, Math.max(meals.length, 1));
  const error = macroError(targetMacros, average);
  const tolerance = 18;

  return {
    meals,
    days: daysResult,
    averageMacros: average,
    macroError: error,
    fallbackApplied: meals.length === 0 || error > tolerance,
    fallbackReasonCode: meals.length === 0 ? 'ERR_NO_RECIPES_MATCH_FILTERS' : (error > tolerance ? 'ERR_MACRO_MATCH_NOT_FOUND' : null),
    debug: [
      ...debug,
      { step: 'macro_evaluation', details: { error, tolerance } },
    ],
  };
}

function buildPlanningPreview({ recipes, seed = 0, days = 7, mealType, cuisine, includeIngredient, excludeIngredient, sex, dailyCalories, weightKg, requestedWeeklyLossKg }) {
  const calorie = applyCalorieFloor({ sex, proposedDailyCalories: dailyCalories });
  const weeklyCap = applyWeeklyCap({ currentWeightKg: weightKg, requestedWeeklyLossKg });
  const targetMacros = allocateMacros({ dailyCalories: calorie.finalDailyCalories, weightKg });

  const plan = mealType
    ? planWeek({ recipes, seed, days, mealType, cuisine, includeIngredient, excludeIngredient, targetMacros })
    : planWeekByMeals({ recipes, seed, days, cuisine, includeIngredient, excludeIngredient, targetMacros });

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
  planWeekByMeals,
  buildPlanningPreview,
};
