const seedRecipes = [
  {
    id: 'r-oats-bowl',
    name: 'Protein Oats Bowl',
    cuisine: 'american',
    mealType: 'breakfast',
    macros: { proteinG: 28, fatG: 11, carbG: 52 },
    ingredients: [
      { name: 'oats', qty: 80, unit: 'g', category: 'grains' },
      { name: 'milk', qty: 250, unit: 'ml', category: 'dairy' },
      { name: 'chia seeds', qty: 15, unit: 'g', category: 'pantry' },
      { name: 'berries', qty: 100, unit: 'g', category: 'veggies' },
    ]
  },
  {
    id: 'r-egg-wrap',
    name: 'Egg Wrap',
    cuisine: 'american',
    mealType: 'breakfast',
    macros: { proteinG: 24, fatG: 18, carbG: 22 },
    ingredients: [
      { name: 'egg', qty: 3, unit: 'item', category: 'protein' },
      { name: 'tortilla', qty: 1, unit: 'item', category: 'bread' },
      { name: 'spinach', qty: 80, unit: 'g', category: 'veggies' },
      { name: 'cheese', qty: 30, unit: 'g', category: 'dairy' },
    ]
  },
  {
    id: 'r-greek-chicken',
    name: 'Greek Chicken Plate',
    cuisine: 'mediterranean',
    mealType: 'lunch',
    macros: { proteinG: 45, fatG: 14, carbG: 34 },
    ingredients: [
      { name: 'chicken breast', qty: 220, unit: 'g', category: 'protein' },
      { name: 'olive oil', qty: 15, unit: 'ml', category: 'pantry' },
      { name: 'cucumber', qty: 120, unit: 'g', category: 'veggies' },
      { name: 'tomato', qty: 150, unit: 'g', category: 'veggies' },
      { name: 'rice', qty: 160, unit: 'g', category: 'grains' },
    ]
  },
  {
    id: 'r-turkey-sandwich',
    name: 'Turkey Avocado Sandwich',
    cuisine: 'american',
    mealType: 'lunch',
    macros: { proteinG: 37, fatG: 16, carbG: 41 },
    ingredients: [
      { name: 'turkey breast', qty: 170, unit: 'g', category: 'protein' },
      { name: 'whole grain bread', qty: 2, unit: 'item', category: 'bread' },
      { name: 'avocado', qty: 80, unit: 'g', category: 'veggies' },
      { name: 'lettuce', qty: 70, unit: 'g', category: 'veggies' },
      { name: 'tomato', qty: 70, unit: 'g', category: 'veggies' },
    ]
  },
  {
    id: 'r-beef-rice-bowl',
    name: 'Beef Rice Bowl',
    cuisine: 'asian',
    mealType: 'lunch',
    macros: { proteinG: 42, fatG: 19, carbG: 48 },
    ingredients: [
      { name: 'lean beef', qty: 210, unit: 'g', category: 'protein' },
      { name: 'rice', qty: 180, unit: 'g', category: 'grains' },
      { name: 'carrot', qty: 90, unit: 'g', category: 'veggies' },
      { name: 'broccoli', qty: 120, unit: 'g', category: 'veggies' },
      { name: 'soy sauce', qty: 18, unit: 'ml', category: 'pantry' },
    ]
  },
  {
    id: 'r-tofu-stirfry',
    name: 'Tofu Veggie Stir Fry',
    cuisine: 'asian',
    mealType: 'dinner',
    macros: { proteinG: 30, fatG: 16, carbG: 40 },
    ingredients: [
      { name: 'tofu', qty: 200, unit: 'g', category: 'protein' },
      { name: 'broccoli', qty: 150, unit: 'g', category: 'veggies' },
      { name: 'soy sauce', qty: 20, unit: 'ml', category: 'pantry' },
      { name: 'ginger', qty: 10, unit: 'g', category: 'pantry' },
      { name: 'rice', qty: 160, unit: 'g', category: 'grains' },
    ]
  },
  {
    id: 'r-salmon-potatoes',
    name: 'Salmon and Potatoes',
    cuisine: 'american',
    mealType: 'dinner',
    macros: { proteinG: 40, fatG: 22, carbG: 36 },
    ingredients: [
      { name: 'salmon', qty: 220, unit: 'g', category: 'protein' },
      { name: 'potato', qty: 260, unit: 'g', category: 'veggies' },
      { name: 'asparagus', qty: 160, unit: 'g', category: 'veggies' },
      { name: 'olive oil', qty: 12, unit: 'ml', category: 'pantry' },
      { name: 'lemon', qty: 40, unit: 'g', category: 'veggies' },
    ]
  },
  {
    id: 'r-chicken-pasta',
    name: 'Chicken Pasta Primavera',
    cuisine: 'mediterranean',
    mealType: 'dinner',
    macros: { proteinG: 44, fatG: 15, carbG: 54 },
    ingredients: [
      { name: 'chicken breast', qty: 210, unit: 'g', category: 'protein' },
      { name: 'pasta', qty: 170, unit: 'g', category: 'grains' },
      { name: 'zucchini', qty: 120, unit: 'g', category: 'veggies' },
      { name: 'bell pepper', qty: 100, unit: 'g', category: 'veggies' },
      { name: 'olive oil', qty: 15, unit: 'ml', category: 'pantry' },
    ]
  },
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
