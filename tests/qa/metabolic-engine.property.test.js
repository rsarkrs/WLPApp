const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyWeeklyCapContract,
  applyCalorieFloorContract,
  allocateMacrosContract,
} = require('./support/metabolic-contract');

test('property: approved weekly loss never exceeds 1% bodyweight cap', () => {
  for (let weightKg = 40; weightKg <= 200; weightKg += 5) {
    for (let requested = 0; requested <= 5; requested += 0.25) {
      const result = applyWeeklyCapContract({ currentWeightKg: weightKg, requestedWeeklyLossKg: requested });
      assert.ok(result.approvedWeeklyLossKg <= result.maxAllowedWeeklyLossKg + 1e-9);
      assert.ok(result.approvedWeeklyLossKg >= 0);
    }
  }
});

test('property: calorie floor always enforced by sex', () => {
  const cases = [
    { sex: 'female', floor: 1200 },
    { sex: 'male', floor: 1600 },
  ];

  for (const { sex, floor } of cases) {
    for (let proposedDailyCalories = 600; proposedDailyCalories <= 2800; proposedDailyCalories += 100) {
      const result = applyCalorieFloorContract({ sex, proposedDailyCalories });
      assert.ok(result.finalDailyCalories >= floor);
      assert.equal(result.floorCalories, floor);
    }
  }
});

test('property: macro allocation output is non-negative integers', () => {
  for (let dailyCalories = 1200; dailyCalories <= 3200; dailyCalories += 100) {
    for (let weightKg = 45; weightKg <= 140; weightKg += 5) {
      const result = allocateMacrosContract({ dailyCalories, weightKg });
      for (const key of ['proteinG', 'fatG', 'carbG']) {
        assert.ok(Number.isInteger(result[key]));
        assert.ok(result[key] >= 0);
      }
      assert.ok(Number.isInteger(result.residualCalories));
      assert.ok(Math.abs(result.residualCalories) <= 9);
    }
  }
});
