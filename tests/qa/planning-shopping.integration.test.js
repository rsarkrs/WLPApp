const test = require('node:test');
const assert = require('node:assert/strict');

function planWeek({ recipes, days = 7, seed = 0 }) {
  const selected = [];
  for (let i = 0; i < days; i += 1) {
    selected.push(recipes[(i + seed) % recipes.length]);
  }
  return selected;
}

function aggregateShoppingList(plansByPerson) {
  const totals = new Map();
  for (const personPlan of plansByPerson) {
    for (const recipe of personPlan) {
      for (const ingredient of recipe.ingredients) {
        const key = `${ingredient.name}|${ingredient.unit}`;
        totals.set(key, (totals.get(key) ?? 0) + ingredient.qty);
      }
    }
  }
  return Array.from(totals.entries()).map(([key, qty]) => {
    const [name, unit] = key.split('|');
    return { name, unit, qty };
  });
}

test('integration: weekly planning is deterministic with seed', () => {
  const recipes = [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }];

  const planA = planWeek({ recipes, seed: 2 });
  const planB = planWeek({ recipes, seed: 2 });

  assert.deepEqual(planA, planB);
  assert.equal(planA.length, 7);
});

test('integration: shopping list aggregation merges duplicate ingredients', () => {
  const recipes = [
    { id: 'oats-bowl', ingredients: [{ name: 'oats', unit: 'g', qty: 50 }, { name: 'milk', unit: 'ml', qty: 200 }] },
    { id: 'oats-smoothie', ingredients: [{ name: 'oats', unit: 'g', qty: 30 }, { name: 'milk', unit: 'ml', qty: 250 }] },
  ];

  const person1 = [recipes[0], recipes[1]];
  const person2 = [recipes[0]];

  const list = aggregateShoppingList([person1, person2]);
  const oats = list.find((item) => item.name === 'oats' && item.unit === 'g');
  const milk = list.find((item) => item.name === 'milk' && item.unit === 'ml');

  assert.equal(oats.qty, 130);
  assert.equal(milk.qty, 650);
});
