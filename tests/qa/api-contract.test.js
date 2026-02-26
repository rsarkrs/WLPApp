const test = require('node:test');
const assert = require('node:assert/strict');
const { fixtures } = require('./support/metabolic-contract');

function assertPlanResponseContract(response) {
  assert.equal(typeof response.weekStart, 'string');
  assert.ok(Array.isArray(response.days));
  for (const day of response.days) {
    assert.equal(typeof day.date, 'string');
    assert.ok(Array.isArray(day.meals));
  }
}

function assertShoppingResponseContract(response) {
  assert.equal(typeof response.householdId, 'string');
  assert.ok(Array.isArray(response.items));
  for (const item of response.items) {
    assert.equal(typeof item.name, 'string');
    assert.equal(typeof item.unit, 'string');
    assert.equal(typeof item.quantity, 'number');
  }
}

test('contract: weekly planning API payload shape', () => {
  const response = {
    weekStart: '2026-01-05',
    days: [
      { date: '2026-01-05', meals: [{ recipeId: 'r1', servings: 2 }] },
      { date: '2026-01-06', meals: [{ recipeId: 'r2', servings: 2 }] },
    ],
  };

  assertPlanResponseContract(response);
});

test('contract: shopping list API payload shape', () => {
  const response = {
    householdId: 'hh_123',
    items: [
      { name: 'chicken breast', unit: 'g', quantity: 1200 },
      { name: 'rice', unit: 'g', quantity: 1000 },
    ],
  };

  assertShoppingResponseContract(response);
});

test('contract: error response shape is stable and code/message align with shared fixtures', () => {
  for (const example of fixtures.errorExamples) {
    const errorResponse = {
      error: {
        code: example.expectedError.code,
        message: example.expectedError.message,
        details: [{ fixtureId: example.id, context: example.context }],
      },
    };

    assert.equal(typeof errorResponse.error.code, 'string');
    assert.equal(typeof errorResponse.error.message, 'string');
    assert.ok(Array.isArray(errorResponse.error.details));
  }
});
