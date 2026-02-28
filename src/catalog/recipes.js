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
    cuisine: 'korean',
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
    cuisine: 'chinese',
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
    cuisine: 'italian',
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
  {
    id: 'r-korean-bulgogi-bowl',
    name: 'Korean Bulgogi Bowl',
    cuisine: 'korean',
    mealType: 'dinner',
    macros: { proteinG: 46, fatG: 17, carbG: 47 },
    ingredients: [
      { name: 'beef sirloin', qty: 220, unit: 'g', category: 'protein' },
      { name: 'rice', qty: 180, unit: 'g', category: 'grains' },
      { name: 'kimchi', qty: 90, unit: 'g', category: 'veggies' },
      { name: 'sesame oil', qty: 10, unit: 'ml', category: 'pantry' },
      { name: 'scallion', qty: 30, unit: 'g', category: 'veggies' },
    ]
  },
  {
    id: 'r-chinese-ginger-chicken',
    name: 'Chinese Ginger Chicken',
    cuisine: 'chinese',
    mealType: 'lunch',
    macros: { proteinG: 43, fatG: 13, carbG: 45 },
    ingredients: [
      { name: 'chicken thigh', qty: 210, unit: 'g', category: 'protein' },
      { name: 'ginger', qty: 12, unit: 'g', category: 'pantry' },
      { name: 'garlic', qty: 8, unit: 'g', category: 'pantry' },
      { name: 'rice', qty: 165, unit: 'g', category: 'grains' },
      { name: 'bok choy', qty: 150, unit: 'g', category: 'veggies' },
    ]
  },
  {
    id: 'r-italian-turkey-meatballs',
    name: 'Italian Turkey Meatballs',
    cuisine: 'italian',
    mealType: 'dinner',
    macros: { proteinG: 48, fatG: 14, carbG: 41 },
    ingredients: [
      { name: 'ground turkey', qty: 220, unit: 'g', category: 'protein' },
      { name: 'tomato sauce', qty: 120, unit: 'ml', category: 'veggies' },
      { name: 'whole wheat pasta', qty: 150, unit: 'g', category: 'grains' },
      { name: 'basil', qty: 8, unit: 'g', category: 'veggies' },
      { name: 'olive oil', qty: 10, unit: 'ml', category: 'pantry' },
    ]
  },
];


const instructionByRecipeId = {
  'r-oats-bowl': [
    'Cook oats in milk until creamy.',
    'Stir in chia seeds and top with berries before serving.'
  ],
  'r-egg-wrap': [
    'Scramble eggs in a pan and warm the tortilla.',
    'Fill with eggs, spinach, and cheese, then fold and serve.'
  ],
  'r-greek-chicken': [
    'Season and sear chicken until cooked through.',
    'Serve with rice, cucumber, and tomato, then drizzle olive oil.'
  ],
  'r-turkey-sandwich': [
    'Layer turkey, avocado, lettuce, and tomato on bread.',
    'Slice and serve immediately.'
  ],
  'r-beef-rice-bowl': [
    'Brown beef in a skillet and cook rice separately.',
    'Serve with carrot and broccoli, then finish with soy sauce.'
  ],
  'r-tofu-stirfry': [
    'Stir-fry tofu until lightly crisp.',
    'Add vegetables, ginger, and soy sauce, then serve over rice.'
  ],
  'r-salmon-potatoes': [
    'Roast salmon and potatoes until tender.',
    'Serve with asparagus and lemon with olive oil drizzle.'
  ],
  'r-chicken-pasta': [
    'Cook pasta and sauté chicken until done.',
    'Toss with vegetables and olive oil, then serve warm.'
  ],
  'r-korean-bulgogi-bowl': [
    'Sear beef with sesame oil in a hot pan.',
    'Serve over rice with kimchi and sliced scallion.'
  ],
  'r-chinese-ginger-chicken': [
    'Cook chicken with ginger and garlic until browned.',
    'Serve with rice and bok choy.'
  ],
  'r-italian-turkey-meatballs': [
    'Form turkey meatballs and bake or pan-sear until cooked.',
    'Simmer in tomato sauce and serve over pasta with basil.'
  ],
};

for (const recipe of seedRecipes) {
  if (!recipe.instructions) {
    recipe.instructions = instructionByRecipeId[recipe.id] || ['Prepare ingredients, cook thoroughly, and serve warm.'];
  }
}

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

function parseTokenList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((part) => normalizeToken(part))
    .filter(Boolean);
}

function filterRecipes(recipes, query = {}) {
  const cuisines = parseTokenList(query.cuisine);
  const mealTypes = parseTokenList(query.mealType);
  const includeIngredients = parseIngredientList(query.includeIngredient);
  const excludeIngredients = parseIngredientList(query.excludeIngredient);

  return recipes.filter((recipe) => {
    if (cuisines.length > 0 && !cuisines.includes(normalizeToken(recipe.cuisine))) {
      return false;
    }

    if (mealTypes.length > 0 && !mealTypes.includes(normalizeToken(recipe.mealType))) {
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
