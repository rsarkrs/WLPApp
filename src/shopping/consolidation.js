function normalizeToken(value) {
  return String(value || '').trim().toLowerCase();
}

const unitConverters = {
  g: { baseUnit: 'g', factor: 1 },
  kg: { baseUnit: 'g', factor: 1000 },
  ml: { baseUnit: 'ml', factor: 1 },
  l: { baseUnit: 'ml', factor: 1000 },
  item: { baseUnit: 'item', factor: 1 },
};

function normalizeIngredient({ name, qty, unit }) {
  const converter = unitConverters[normalizeToken(unit)];
  if (!converter) {
    return {
      name: normalizeToken(name),
      qty,
      unit: normalizeToken(unit),
      normalizedQty: qty,
      normalizedUnit: normalizeToken(unit),
      normalized: false,
    };
  }

  return {
    name: normalizeToken(name),
    qty,
    unit: normalizeToken(unit),
    normalizedQty: qty * converter.factor,
    normalizedUnit: converter.baseUnit,
    normalized: true,
  };
}

function consolidateShoppingList({ meals, pantryExclusions = [] }) {
  const excluded = new Set(pantryExclusions.map((x) => normalizeToken(x)));
  const totals = new Map();

  for (const meal of meals) {
    const ingredients = meal.ingredients || [];
    for (const ingredient of ingredients) {
      const normalized = normalizeIngredient(ingredient);
      if (excluded.has(normalized.name)) {
        continue;
      }

      const key = `${normalized.name}|${normalized.normalizedUnit}`;
      totals.set(key, (totals.get(key) || 0) + normalized.normalizedQty);
    }
  }

  return Array.from(totals.entries())
    .map(([key, qty]) => {
      const [name, unit] = key.split('|');
      return { name, unit, qty: Number(qty.toFixed(2)) };
    })
    .sort((a, b) => a.name.localeCompare(b.name) || a.unit.localeCompare(b.unit));
}

module.exports = {
  normalizeIngredient,
  consolidateShoppingList,
};
