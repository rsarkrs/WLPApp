const seedRecipes = [
  {
    id: 'r-oats-bowl',
    name: 'Protein Oats Bowl',
    cuisine: 'american',
    mealType: 'breakfast',
    macros: { proteinG: 28, fatG: 11, carbG: 52 },
    ingredients: ['oats', 'milk', 'chia seeds', 'berries']
  },
  {
    id: 'r-greek-chicken',
    name: 'Greek Chicken Plate',
    cuisine: 'mediterranean',
    mealType: 'lunch',
    macros: { proteinG: 45, fatG: 14, carbG: 34 },
    ingredients: ['chicken breast', 'olive oil', 'cucumber', 'tomato', 'rice']
  },
  {
    id: 'r-tofu-stirfry',
    name: 'Tofu Veggie Stir Fry',
    cuisine: 'asian',
    mealType: 'dinner',
    macros: { proteinG: 30, fatG: 16, carbG: 40 },
    ingredients: ['tofu', 'broccoli', 'soy sauce', 'ginger', 'rice']
  },
  {
    id: 'r-egg-wrap',
    name: 'Egg Wrap',
    cuisine: 'american',
    mealType: 'breakfast',
    macros: { proteinG: 24, fatG: 18, carbG: 22 },
    ingredients: ['egg', 'tortilla', 'spinach', 'cheese']
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

    const ingredientSet = new Set(recipe.ingredients.map((i) => normalizeToken(i)));

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
