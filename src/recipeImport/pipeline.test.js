import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDedupeKeys,
  canonicalizeUrl,
  fallbackExtractor,
  mapNutrition,
  normalizeIngredients,
  parseSchemaOrgRecipe,
  validateRecipe,
} from './pipeline.js';

test('canonicalizeUrl strips tracking params and fragment', () => {
  const canonical = canonicalizeUrl('HTTPS://Example.com/recipe/?utm_source=x&id=1#section');
  assert.equal(canonical, 'https://example.com/recipe?id=1');
});

test('parseSchemaOrgRecipe reads Recipe node from ld+json', () => {
  const html = `
  <html><head>
  <script type="application/ld+json">{
    "@context":"https://schema.org",
    "@type":"Recipe",
    "name":"Soup",
    "recipeIngredient":["1 cup broth"],
    "recipeInstructions":["Boil."]
  }</script>
  </head></html>`;

  const recipe = parseSchemaOrgRecipe(html, 'https://example.com/soup');
  assert.equal(recipe?.name, 'Soup');
  assert.equal(recipe?.ingredients.length, 1);
});

test('fallbackExtractor extracts basic content when schema missing', () => {
  const html = '<title>Quick Pasta</title><li>1 cup pasta</li><p>Cook pasta and serve hot.</p>';
  const recipe = fallbackExtractor(html, 'https://example.com/pasta');
  assert.equal(recipe.name, 'Quick Pasta');
  assert.equal(recipe.ingredients[0], '1 cup pasta');
});

test('validateRecipe enforces required fields and unit warnings', () => {
  const ingredients = normalizeIngredients(['1 glug olive oil']);
  const result = validateRecipe({
    name: 'Test',
    ingredients,
    instructions: ['Mix'],
  });

  assert.equal(result.valid, true);
  assert.equal(result.warnings.length, 1);
});

test('buildDedupeKeys returns stable hash', () => {
  const recipe = {
    name: 'Best Tomato Pasta Recipe',
    sourceUrl: 'https://example.com/pasta?utm_source=a',
    ingredients: normalizeIngredients(['1 cup tomato', '2 tbsp olive oil']),
    instructions: ['Mix', 'Serve'],
  };

  const dedupe = buildDedupeKeys(recipe);
  assert.equal(dedupe.canonicalUrl, 'https://example.com/pasta');
  assert.equal(dedupe.normalizedName, 'tomato pasta');
  assert.equal(dedupe.recipeHash.length, 64);
});

test('mapNutrition estimates calories when structured nutrition missing', () => {
  const nutrition = mapNutrition({}, normalizeIngredients(['2 tbsp olive oil', '1 cup rice']));
  assert.equal(nutrition.source, 'estimated_from_ingredients');
  assert.equal(nutrition.calories > 0, true);
});
