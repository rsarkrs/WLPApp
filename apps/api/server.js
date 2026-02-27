const express = require('express');
const { computeBmrTdee } = require('../../src/domain/metabolicEngine');
const { seedRecipes, filterRecipes, validateRecipe } = require('../../src/catalog/recipes');
const { buildPlanningPreview } = require('../../src/planner/engine');

const app = express();
const port = Number(process.env.PORT || 4000);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'wlpapp-api' });
});

app.get('/v1/metabolic/preview', (req, res) => {
  try {
    const result = computeBmrTdee({
      sex: req.query.sex,
      ageYears: Number(req.query.ageYears),
      heightCm: Number(req.query.heightCm),
      weightKg: Number(req.query.weightKg),
      activityLevel: req.query.activityLevel,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      code: error.code || 'ERR_INVALID_REQUEST',
      message: error.message,
    });
  }
});


app.get('/v1/recipes', (req, res) => {
  const invalidRecipes = seedRecipes
    .map((recipe) => ({ recipe, validation: validateRecipe(recipe) }))
    .filter(({ validation }) => !validation.valid)
    .map(({ recipe, validation }) => ({ id: recipe.id, errors: validation.errors }));

  if (invalidRecipes.length > 0) {
    return res.status(500).json({
      code: 'ERR_INVALID_RECIPE_SEED',
      invalidRecipes
    });
  }

  const items = filterRecipes(seedRecipes, req.query).map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    cuisine: recipe.cuisine,
    mealType: recipe.mealType,
    macros: recipe.macros,
    ingredients: recipe.ingredients,
  }));

  return res.status(200).json({
    total: items.length,
    items
  });
});


app.get('/v1/plans/preview', (req, res) => {
  try {
    const result = buildPlanningPreview({
      recipes: seedRecipes,
      seed: Number(req.query.seed || 0),
      days: Number(req.query.days || 7),
      mealType: req.query.mealType,
      cuisine: req.query.cuisine,
      sex: req.query.sex || 'female',
      dailyCalories: Number(req.query.dailyCalories || 1800),
      weightKg: Number(req.query.weightKg || 70),
      requestedWeeklyLossKg: Number(req.query.requestedWeeklyLossKg || 0.4),
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      code: error.code || 'ERR_INVALID_REQUEST',
      message: error.message,
    });
  }
});

app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'WLPApp API scaffold',
    endpoints: ['/health', '/v1/metabolic/preview', '/v1/recipes', '/v1/plans/preview']
  });
});

app.listen(port, () => {
  console.log(`WLPApp API listening on http://localhost:${port}`);
});
