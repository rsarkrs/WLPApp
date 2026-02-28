const express = require('express');
const { computeBmrTdee } = require('../../src/domain/metabolicEngine');
const { seedRecipes, filterRecipes, validateRecipe } = require('../../src/catalog/recipes');
const { buildPlanningPreview } = require('../../src/planner/engine');
const { ingestRecipeFromUrl } = require('../../src/recipeImport/pipeline');
const { consolidateShoppingList } = require('../../src/shopping/consolidation');
const { upsertProfile, getProfile, listProfiles, getPlanningResult, savePlanningResult, nextImportRunId, saveImportRun, getImportRun, findImportRunByHash } = require('../../src/api/state');

const app = express();
app.use(express.json());
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



app.post('/v1/profile', (req, res) => {
  const payload = req.body || {};
  if (!payload.householdId || !payload.memberId || !payload.sex) {
    return res.status(400).json({
      code: 'ERR_INVALID_PROFILE',
      message: 'householdId, memberId, and sex are required.',
    });
  }

  const profile = upsertProfile(payload);
  return res.status(200).json(profile);
});


app.post('/v1/imports', async (req, res) => {
  const payload = req.body || {};

  if (!payload.sourceUrl) {
    return res.status(400).json({
      code: 'ERR_MISSING_SOURCE_URL',
      message: 'sourceUrl is required.',
    });
  }

  try {
    let fetchImpl;
    if (payload.html) {
      fetchImpl = async () => ({
        ok: true,
        status: 200,
        text: async () => payload.html,
      });
    }

    const importResult = await ingestRecipeFromUrl(payload.sourceUrl, fetchImpl ? { fetchImpl } : undefined);
    const existing = findImportRunByHash(importResult.dedupe.recipeHash);

    if (existing) {
      return res.status(200).json({
        id: existing.id,
        importStatus: 'duplicate',
        duplicateOf: existing.id,
        sourceAttribution: importResult.sourceAttribution,
        dedupe: importResult.dedupe,
      });
    }

    const run = saveImportRun({
      id: nextImportRunId(),
      importStatus: importResult.importStatus,
      errors: importResult.errors,
      warnings: importResult.warnings,
      sourceAttribution: importResult.sourceAttribution,
      dedupe: importResult.dedupe,
      recipe: importResult.recipe,
      recipeHash: importResult.dedupe.recipeHash,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json(run);
  } catch (error) {
    return res.status(400).json({
      code: error.code || 'ERR_IMPORT_FAILED',
      message: error.message,
    });
  }
});

app.get('/v1/imports/:id', (req, res) => {
  const run = getImportRun(req.params.id);
  if (!run) {
    return res.status(404).json({
      code: 'ERR_IMPORT_NOT_FOUND',
      message: 'Import run not found.',
    });
  }

  return res.status(200).json(run);
});


app.get('/v1/profiles', (req, res) => {
  return res.status(200).json({
    total: listProfiles(req.query.householdId).length,
    items: listProfiles(req.query.householdId),
  });
});

app.get('/v1/profile', (req, res) => {
  const profile = getProfile(req.query.householdId, req.query.memberId);
  if (!profile) {
    return res.status(404).json({
      code: 'ERR_PROFILE_NOT_FOUND',
      message: 'Profile not found for provided household/member.',
    });
  }

  return res.status(200).json(profile);
});

app.post('/v1/plans/generate', (req, res) => {
  const payload = req.body || {};

  if (!payload.idempotencyKey) {
    return res.status(400).json({
      code: 'ERR_MISSING_IDEMPOTENCY_KEY',
      message: 'idempotencyKey is required.',
    });
  }

  const existing = getPlanningResult(payload.idempotencyKey);
  if (existing) {
    return res.status(200).json({ ...existing, idempotentReplay: true });
  }

  try {
    const result = buildPlanningPreview({
      recipes: seedRecipes,
      seed: Number(payload.seed || 0),
      days: Number(payload.days || 7),
      mealType: payload.mealType,
      cuisine: payload.cuisine,
      includeIngredient: payload.includeIngredient,
      excludeIngredient: payload.excludeIngredient,
      sex: payload.sex || 'female',
      dailyCalories: Number(payload.dailyCalories || 1800),
      weightKg: Number(payload.weightKg || 70),
      requestedWeeklyLossKg: Number(payload.requestedWeeklyLossKg || 0.4),
    });

    const saved = savePlanningResult(payload.idempotencyKey, {
      idempotentReplay: false,
      result,
    });

    return res.status(200).json(saved);
  } catch (error) {
    return res.status(400).json({
      code: error.code || 'ERR_INVALID_REQUEST',
      message: error.message,
    });
  }
});


app.get('/v1/shopping/preview', (req, res) => {
  try {
    const preview = buildPlanningPreview({
      recipes: seedRecipes,
      seed: Number(req.query.seed || 0),
      days: Number(req.query.days || 7),
      mealType: req.query.mealType,
      cuisine: req.query.cuisine,
      includeIngredient: req.query.includeIngredient,
      excludeIngredient: req.query.excludeIngredient,
      sex: req.query.sex || 'female',
      dailyCalories: Number(req.query.dailyCalories || 1800),
      weightKg: Number(req.query.weightKg || 70),
      requestedWeeklyLossKg: Number(req.query.requestedWeeklyLossKg || 0.4),
    });

    const plannedRecipes = preview.plan.meals.map((meal) => seedRecipes.find((recipe) => recipe.id === meal.recipeId)).filter(Boolean);
    const pantryExclusions = String(req.query.pantryExclude || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const shoppingList = consolidateShoppingList({
      meals: plannedRecipes,
      pantryExclusions,
    });

    const byCategory = shoppingList.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});

    return res.status(200).json({
      pantryExclusions,
      totalItems: shoppingList.length,
      items: shoppingList,
      byCategory,
    });
  } catch (error) {
    return res.status(400).json({
      code: error.code || 'ERR_INVALID_REQUEST',
      message: error.message,
    });
  }
});

app.get('/v1/plans/preview', (req, res) => {
  try {
    const result = buildPlanningPreview({
      recipes: seedRecipes,
      seed: Number(req.query.seed || 0),
      days: Number(req.query.days || 7),
      mealType: req.query.mealType,
      cuisine: req.query.cuisine,
      includeIngredient: req.query.includeIngredient,
      excludeIngredient: req.query.excludeIngredient,
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
    endpoints: ['/health', '/v1/profile', '/v1/profiles', '/v1/imports', '/v1/metabolic/preview', '/v1/recipes', '/v1/plans/preview', '/v1/plans/generate', '/v1/shopping/preview']
  });
});

app.listen(port, () => {
  console.log(`WLPApp API listening on http://localhost:${port}`);
});
