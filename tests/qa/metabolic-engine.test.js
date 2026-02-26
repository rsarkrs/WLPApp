const test = require('node:test');
const assert = require('node:assert/strict');
const {
  fixtures,
  contextToFunction,
  computeBmrTdeeContract,
  applyWeeklyCapContract,
  applyCalorieFloorContract,
  allocateMacrosContract,
} = require('./support/metabolic-contract');

function assertContractError(example, fn) {
  assert.throws(
    () => fn(example.input),
    (error) => error.code === example.expectedError.code && error.message === example.expectedError.message,
    `${example.id} must return exact code/message`,
  );
}

test('contract fixtures: BMR/TDEE examples match exact outputs and rounding policy', () => {
  for (const example of fixtures.bmrTdeeExamples) {
    const actual = computeBmrTdeeContract(example.input);
    assert.deepEqual(actual, example.expected);
  }
});

test('contract fixtures: weekly cap examples include clamp and exact boundary behavior', () => {
  for (const example of fixtures.weeklyCapExamples) {
    const actual = applyWeeklyCapContract(example.input);
    assert.deepEqual(actual, example.expected);
  }
});

test('contract fixtures: calorie floor examples include floor application and boundary behavior', () => {
  for (const example of fixtures.calorieFloorExamples) {
    const actual = applyCalorieFloorContract(example.input);
    assert.deepEqual(actual, example.expected);
  }
});

test('contract fixtures: macro allocation fixtures validate primary and fallback strategies', () => {
  for (const example of fixtures.macroAllocationExamples) {
    const actual = allocateMacrosContract(example.input);
    assert.deepEqual(actual, example.expected);
  }
});

test('contract fixtures: error examples return exact contract code/message', () => {
  for (const example of fixtures.errorExamples) {
    assertContractError(example, contextToFunction[example.context]);
  }
});
