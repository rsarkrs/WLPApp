import crypto from 'node:crypto';

const STOPWORDS = new Set(['the', 'a', 'an', 'recipe', 'best', 'easy', 'simple']);
const UNIT_ALIASES = {
  teaspoons: 'tsp',
  teaspoon: 'tsp',
  tsp: 'tsp',
  tablespoons: 'tbsp',
  tablespoon: 'tbsp',
  tbsp: 'tbsp',
  cups: 'cup',
  cup: 'cup',
  ounces: 'oz',
  ounce: 'oz',
  oz: 'oz',
  pounds: 'lb',
  pound: 'lb',
  lb: 'lb',
  lbs: 'lb',
  grams: 'g',
  gram: 'g',
  g: 'g',
  kilograms: 'kg',
  kilogram: 'kg',
  kg: 'kg',
  milliliters: 'ml',
  milliliter: 'ml',
  ml: 'ml',
  liters: 'l',
  liter: 'l',
  l: 'l',
  pinch: 'pinch',
  cloves: 'clove',
  clove: 'clove',
};

const REQUIRED_RECIPE_FIELDS = ['name', 'ingredients', 'instructions'];

export async function ingestRecipeFromUrl(url, { fetchImpl = fetch } = {}) {
  const sourceUrl = canonicalizeUrl(url);
  const fetchResult = await fetchStage(sourceUrl, fetchImpl);
  const schemaRecipe = parseSchemaOrgRecipe(fetchResult.html, sourceUrl);
  const extractedRecipe = schemaRecipe ?? fallbackExtractor(fetchResult.html, sourceUrl);
  const normalizedIngredients = normalizeIngredients(extractedRecipe.ingredients || []);
  const nutrition = mapNutrition(extractedRecipe.nutrition || {}, normalizedIngredients);

  const recipe = {
    ...extractedRecipe,
    sourceUrl,
    ingredients: normalizedIngredients,
    nutrition,
  };

  const validation = validateRecipe(recipe);
  const dedupe = buildDedupeKeys(recipe);

  return {
    importStatus: validation.valid ? 'imported' : 'failed_validation',
    errors: validation.errors,
    warnings: validation.warnings,
    dedupe,
    sourceAttribution: {
      sourceUrl,
      fetchedAt: fetchResult.fetchedAt,
      extractionMethod: schemaRecipe ? 'schema_org' : 'fallback_extractor',
      sourceDomain: new URL(sourceUrl).hostname,
    },
    recipe,
  };
}

export async function fetchStage(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'WLPApp Recipe Importer/1.0 (+https://wlpapp.local)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch recipe URL: HTTP ${response.status}`);
  }

  return {
    fetchedAt: new Date().toISOString(),
    html: await response.text(),
  };
}

export function parseSchemaOrgRecipe(html, sourceUrl) {
  const scriptMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];

  for (const [, payload] of scriptMatches) {
    try {
      const data = JSON.parse(payload.trim());
      const candidate = extractRecipeNode(data);
      if (candidate) {
        return normalizeRecipeNode(candidate, sourceUrl);
      }
    } catch {
      continue;
    }
  }

  return null;
}

function extractRecipeNode(node) {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const found = extractRecipeNode(item);
      if (found) return found;
    }
  }

  if (typeof node === 'object') {
    if (isRecipeType(node['@type'])) {
      return node;
    }

    if (node['@graph']) {
      const found = extractRecipeNode(node['@graph']);
      if (found) return found;
    }
  }

  return null;
}

function isRecipeType(typeField) {
  if (!typeField) return false;
  if (Array.isArray(typeField)) return typeField.some((entry) => `${entry}`.toLowerCase() === 'recipe');
  return `${typeField}`.toLowerCase() === 'recipe';
}

function normalizeRecipeNode(node, sourceUrl) {
  return {
    name: node.name?.trim(),
    description: node.description?.trim(),
    sourceUrl,
    yield: node.recipeYield,
    ingredients: node.recipeIngredient || [],
    instructions: normalizeInstructions(node.recipeInstructions),
    nutrition: node.nutrition || {},
    image: Array.isArray(node.image) ? node.image[0] : node.image,
  };
}

function normalizeInstructions(instructions) {
  if (!instructions) return [];
  if (Array.isArray(instructions)) {
    return instructions
      .map((step) => (typeof step === 'string' ? step : step.text))
      .filter(Boolean)
      .map((step) => step.trim());
  }
  if (typeof instructions === 'string') {
    return instructions
      .split(/\n+/)
      .map((step) => step.trim())
      .filter(Boolean);
  }
  return [];
}

export function fallbackExtractor(html, sourceUrl) {
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
  const ingredientMatches = [...html.matchAll(/<li[^>]*>([^<]*(cup|tbsp|tsp|gram|g|oz|lb)[^<]*)<\/li>/gi)].map((m) => m[1].trim());
  const paragraphSteps = [...html.matchAll(/<p[^>]*>([^<]{20,})<\/p>/gi)]
    .map((m) => m[1].trim())
    .filter((text) => /mix|cook|bake|stir|serve|heat|add/i.test(text));

  return {
    name: title || 'Untitled Recipe',
    sourceUrl,
    ingredients: ingredientMatches,
    instructions: paragraphSteps.slice(0, 20),
    nutrition: {},
  };
}

export function normalizeIngredients(ingredients) {
  return ingredients.map((raw) => {
    const parsed = parseIngredient(raw);
    return {
      raw,
      quantity: parsed.quantity,
      unit: parsed.unit,
      item: parsed.item,
      normalizedUnit: parsed.unit ? (UNIT_ALIASES[parsed.unit.toLowerCase()] ?? null) : null,
    };
  });
}

function parseIngredient(raw) {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  const match = cleaned.match(/^(\d+(?:[./]\d+)?)\s*([a-zA-Z]+)?\s*(.*)$/);
  if (!match) {
    return { quantity: null, unit: null, item: cleaned };
  }

  const quantity = Number.parseFloat(match[1].replace('/', '.'));
  const unit = match[2] || null;
  const item = match[3]?.trim() || null;

  return { quantity: Number.isFinite(quantity) ? quantity : null, unit, item };
}

export function mapNutrition(nutrition = {}, ingredients = []) {
  const calories = toNumber(nutrition.calories);
  const protein = toNumber(nutrition.proteinContent);
  const carbs = toNumber(nutrition.carbohydrateContent);
  const fat = toNumber(nutrition.fatContent);

  if ([calories, protein, carbs, fat].every((value) => value !== null)) {
    return { calories, protein, carbs, fat, source: 'schema_org' };
  }

  const heuristicCalories = ingredients.reduce((sum, ingredient) => {
    if (!ingredient.quantity) return sum;
    if (ingredient.normalizedUnit === 'tbsp') return sum + ingredient.quantity * 45;
    if (ingredient.normalizedUnit === 'tsp') return sum + ingredient.quantity * 15;
    if (ingredient.normalizedUnit === 'cup') return sum + ingredient.quantity * 120;
    return sum + ingredient.quantity * 25;
  }, 0);

  return {
    calories: Math.round(heuristicCalories),
    protein,
    carbs,
    fat,
    source: 'estimated_from_ingredients',
  };
}

function toNumber(value) {
  if (value == null) return null;
  const match = `${value}`.match(/\d+(?:\.\d+)?/);
  return match ? Number.parseFloat(match[0]) : null;
}

export function validateRecipe(recipe) {
  const errors = [];
  const warnings = [];

  for (const field of REQUIRED_RECIPE_FIELDS) {
    const value = recipe[field];
    const empty = Array.isArray(value) ? value.length === 0 : !value;
    if (empty) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  recipe.ingredients.forEach((ingredient, index) => {
    if (ingredient.quantity !== null && ingredient.unit && !ingredient.normalizedUnit) {
      warnings.push(`Ingredient ${index + 1} uses unknown unit '${ingredient.unit}'`);
    }

    if (ingredient.quantity !== null && ingredient.quantity <= 0) {
      errors.push(`Ingredient ${index + 1} has invalid quantity '${ingredient.quantity}'`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function buildDedupeKeys(recipe) {
  const canonicalUrl = canonicalizeUrl(recipe.sourceUrl);
  const normalizedName = normalizeName(recipe.name || '');
  const ingredientSignature = recipe.ingredients
    .map((entry) => `${entry.item || ''}:${entry.normalizedUnit || ''}:${entry.quantity || ''}`)
    .sort()
    .join('|');

  const recipeHash = crypto
    .createHash('sha256')
    .update(`${normalizedName}|${ingredientSignature}|${(recipe.instructions || []).join('|')}`)
    .digest('hex');

  return {
    canonicalUrl,
    normalizedName,
    recipeHash,
  };
}

export function canonicalizeUrl(input) {
  const url = new URL(input);

  const dropParams = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']);
  [...url.searchParams.keys()].forEach((key) => {
    if (dropParams.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  });

  url.hash = '';
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  if ((url.protocol === 'https:' && url.port === '443') || (url.protocol === 'http:' && url.port === '80')) {
    url.port = '';
  }

  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !STOPWORDS.has(token))
    .join(' ')
    .trim();
}
