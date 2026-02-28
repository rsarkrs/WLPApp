const test = require('node:test');
const assert = require('node:assert/strict');

const { consolidateShoppingList } = require('../../src/shopping/consolidation');

test('shopping consolidation: merges duplicate ingredients with normalized units', () => {
  const meals = [
    {
      ingredients: [
        { name: 'rice', qty: 0.2, unit: 'kg' },
        { name: 'milk', qty: 300, unit: 'ml' },
      ],
    },
    {
      ingredients: [
        { name: 'rice', qty: 150, unit: 'g' },
        { name: 'milk', qty: 0.2, unit: 'l' },
      ],
    },
  ];

  const result = consolidateShoppingList({ meals });
  const rice = result.find((item) => item.name === 'rice');
  const milk = result.find((item) => item.name === 'milk');

  assert.equal(rice.unit, 'g');
  assert.equal(rice.qty, 350);
  assert.equal(milk.unit, 'ml');
  assert.equal(milk.qty, 500);
});

test('shopping consolidation: excludes pantry items', () => {
  const meals = [
    { ingredients: [{ name: 'rice', qty: 200, unit: 'g' }, { name: 'salt', qty: 5, unit: 'g' }] },
  ];

  const result = consolidateShoppingList({ meals, pantryExclusions: ['salt'] });
  assert.equal(result.length, 1);
  assert.equal(result[0].name, 'rice');
});
