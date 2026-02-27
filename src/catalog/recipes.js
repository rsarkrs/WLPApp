const seedRecipes = [
  {
    id: 'r-oats-bowl',
    name: 'Protein Oats Bowl',
    cuisine: 'american',
    mealType: 'breakfast',
    macros: { proteinG: 28, fatG: 11, carbG: 52 },
    ingredients: [
      { name: 'oats', qty: 80, unit: 'g' },
      { name: 'milk', qty: 250, unit: 'ml' },
      { name: 'chia seeds', qty: 15, unit: 'g' },
      { name: 'berries', qty: 100, unit: 'g' },
    ]
  },
  {
    id: 'r-greek-chicken',
    name: 'Greek Chicken Plate',
    cuisine: 'mediterranean',
    mealType: 'lunch',
    macros: { proteinG: 45, fatG: 14, carbG: 34 },
    ingredients: [
      { name: 'chicken breast', qty: 220, unit: 'g' },
      { name: 'olive oil', qty: 15, unit: 'ml' },
      { name: 'cucumber', qty: 120, unit: 'g' },
      { name: 'tomato', qty: 150, unit: 'g' },
      { name: 'rice', qty: 160, unit: 'g' },
    ]
  },
  {
    id: 'r-tofu-stirfry',
    name: 'Tofu Veggie Stir Fry',
    cuisine: 'asian',
    mealType: 'dinner',
    macros: { proteinG: 30, fatG: 16, carbG: 40 },
    ingredients: [
      { name: 'tofu', qty: 200, unit: 'g' },
      { name: 'broccoli', qty: 150, unit: 'g' },
      { name: 'soy sauce', qty: 20, unit: 'ml' },
      { name: 'ginger', qty: 10, unit: 'g' },
      { name: 'rice', qty: 160, unit: 'g' },
    ]
  },
  {
    id: 'r-egg-wrap',
    name: 'Egg Wrap',
    cuisine: 'american',
    mealType: 'breakfast',
    macros: { proteinG: 24, fatG: 18, carbG: 22 },
    ingredients: [
      { name: 'egg', qty: 3, unit: 'item' },
      { name: 'tortilla', qty: 1, unit: 'item' },
      { name: 'spinach', qty: 80, unit: 'g' },
      { name: 'cheese', qty: 30, unit: 'g' },
    ]
  }
];

function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

function validateRecipe(recipe) {
  const errors = [];

  if (!recipe.id || !recipe.name) {
    errors.push('missing_identity');
  }

  if (!recipe.cuisine || !recipe.mealType) {
    errors.push('missing_taxonomy');
  }

  if (!recipe.macros || Number.isNaN(Number(recipe.macros.proteinG))) {
    errors.push('invalid_macros');
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('missing_ingredients');
  }

  if (Array.isArray(recipe.ingredients)) {
    const invalidIngredient = recipe.ingredients.some((ingredient) => !ingredient.name || !(ingredient.qty > 0) || !ingredient.unit);
    if (invalidIngredient) {
      errors.push('invalid_ingredients');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function parseIngredientList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((part) => normalizeToken(part))
    .filter(Boolean);
}

function filterRecipes(recipes, query = {}) {
  const cuisine = normalizeToken(query.cuisine);
  const mealType = normalizeToken(query.mealType);
  const includeIngredients = parseIngredientList(query.includeIngredient);
  const excludeIngredients = parseIngredientList(query.excludeIngredient);

  return recipes.filter((recipe) => {
    if (cuisine && normalizeToken(recipe.cuisine) !== cuisine) {
      return false;
    }

    if (mealType && normalizeToken(recipe.mealType) !== mealType) {
      return false;
    }

    const ingredientSet = new Set(recipe.ingredients.map((i) => normalizeToken(i.name)));

    if (includeIngredients.some((ingredient) => !ingredientSet.has(ingredient))) {
      return false;
    }

    if (excludeIngredients.some((ingredient) => ingredientSet.has(ingredient))) {
      return false;
    }

    return true;
  });
}

module.exports = {
  seedRecipes,
  validateRecipe,
  filterRecipes
};
