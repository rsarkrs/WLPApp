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
    'Bring milk to a gentle simmer in a saucepan over medium heat and stir in the oats.',
    'Cook for 5 to 7 minutes, stirring often, until the oats are thick and tender.',
    'Turn off the heat, fold in chia seeds, and let the mixture rest for 1 minute to hydrate.',
    'Transfer to a bowl, top with berries, and serve warm.'
  ],
  'r-egg-wrap': [
    'Heat a non-stick skillet over medium heat and whisk eggs with a pinch of salt in a bowl.',
    'Scramble eggs in the skillet for 2 to 3 minutes until softly set, then remove from heat.',
    'Warm the tortilla in the same pan for 20 to 30 seconds per side and layer spinach, eggs, and cheese in the center.',
    'Fold the tortilla into a wrap, return to the pan for 1 minute to melt the cheese, then slice and serve.'
  ],
  'r-greek-chicken': [
    'Season chicken breast with salt and pepper, then sear in a hot skillet with olive oil for 5 to 6 minutes per side until fully cooked.',
    'Cook rice according to package directions while the chicken rests for 3 minutes.',
    'Dice cucumber and tomato and toss with a small pinch of salt.',
    'Slice chicken and plate with rice and vegetables, then finish with a drizzle of olive oil.'
  ],
  'r-turkey-sandwich': [
    'Toast whole grain bread slices until lightly crisp.',
    'Mash avocado with a pinch of salt and spread it on one slice of bread.',
    'Layer turkey breast, lettuce, and tomato evenly over the avocado.',
    'Close the sandwich with the second slice, press gently, cut in half, and serve.'
  ],
  'r-beef-rice-bowl': [
    'Cook rice in a saucepan according to package directions and keep covered when done.',
    'Heat a skillet over medium-high heat, add lean beef, and cook until browned and fully cooked through.',
    'Add carrot and broccoli to the skillet with a splash of water, cover for 2 minutes, then uncover and stir-fry until just tender.',
    'Add soy sauce, stir to coat, and serve over rice.'
  ],
  'r-tofu-stirfry': [
    'Press tofu with paper towels, cut into cubes, and sear in a hot skillet until golden on multiple sides.',
    'Add broccoli and cook for 3 to 4 minutes, stirring frequently.',
    'Stir in ginger and soy sauce and cook for 1 minute until fragrant.',
    'Serve the stir-fry over cooked rice.'
  ],
  'r-salmon-potatoes': [
    'Preheat oven to 425°F (220°C) and spread cubed potatoes on a sheet pan with half the olive oil, salt, and pepper.',
    'Roast potatoes for 20 minutes, then add salmon and asparagus to the pan with remaining olive oil.',
    'Return pan to the oven for 12 to 15 minutes until salmon flakes easily and asparagus is tender.',
    'Plate with lemon on top and serve immediately.'
  ],
  'r-chicken-pasta': [
    'Boil pasta in salted water until al dente, then drain and reserve a small splash of pasta water.',
    'Season chicken and sauté in olive oil over medium-high heat until cooked through, then slice.',
    'In the same pan, sauté zucchini and bell pepper for 3 to 4 minutes until slightly tender.',
    'Combine pasta, chicken, vegetables, and a splash of pasta water, toss for 1 minute, and serve warm.'
  ],
  'r-korean-bulgogi-bowl': [
    'Cook rice according to package directions and keep warm.',
    'Heat a skillet over high heat with sesame oil and sear beef sirloin in a single layer until browned.',
    'Stir in sliced scallion and cook for 30 seconds to soften slightly.',
    'Serve beef and scallion over rice with kimchi on the side.'
  ],
  'r-chinese-ginger-chicken': [
    'Cook rice according to package directions and set aside covered.',
    'Sauté chicken thigh in a hot skillet until browned and cooked through.',
    'Add ginger and garlic, stir for 30 to 60 seconds until aromatic, then fold in chopped bok choy.',
    'Cook until bok choy is tender-crisp and serve over rice.'
  ],
  'r-italian-turkey-meatballs': [
    'Preheat oven to 425°F (220°C), season ground turkey, and form into evenly sized meatballs.',
    'Bake meatballs for 12 to 15 minutes until cooked through and lightly browned.',
    'Warm tomato sauce in a skillet, add baked meatballs, and simmer for 3 to 4 minutes.',
    'Serve over cooked whole wheat pasta and garnish with chopped basil.'
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
