const test = require('node:test');
const assert = require('node:assert/strict');

const { seedRecipes, validateRecipe, filterRecipes } = require('../../src/catalog/recipes');

test('recipe catalog: all seed recipes pass validation', () => {
  for (const recipe of seedRecipes) {
    const result = validateRecipe(recipe);
    assert.equal(result.valid, true, `${recipe.id} should be valid`);
  }
});

test('recipe catalog: cuisine and meal type filtering', () => {
  const filtered = filterRecipes(seedRecipes, { cuisine: 'american', mealType: 'breakfast' });
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((item) => item.cuisine === 'american'));
  assert.ok(filtered.every((item) => item.mealType === 'breakfast'));
});

test('recipe catalog: include/exclude ingredient filtering', () => {
  const include = filterRecipes(seedRecipes, { includeIngredient: 'rice,tofu' });
  assert.equal(include.length, 1);
  assert.equal(include[0].id, 'r-tofu-stirfry');

  const exclude = filterRecipes(seedRecipes, { excludeIngredient: 'rice' });
  assert.equal(exclude.some((item) => item.id === 'r-tofu-stirfry'), false);
  assert.equal(exclude.some((item) => item.id === 'r-greek-chicken'), false);
});
