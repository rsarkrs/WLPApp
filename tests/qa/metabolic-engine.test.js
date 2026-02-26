const test = require('node:test');
const assert = require('node:assert/strict');

function mifflinStJeorBmr({ sex, weightKg, heightCm, ageYears }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

function tdee(bmr, activityMultiplier) {
  return bmr * activityMultiplier;
}

function dailyDeficitWithCap({ currentWeightKg, targetDeficitKcalPerDay }) {
  const maxWeeklyLossKg = currentWeightKg * 0.01;
  const maxWeeklyDeficit = maxWeeklyLossKg * 7700;
  const maxDailyDeficit = maxWeeklyDeficit / 7;
  return Math.min(targetDeficitKcalPerDay, maxDailyDeficit);
}

function applyCalorieFloor({ sex, calories }) {
  const floor = sex === 'male' ? 1600 : 1200;
  return Math.max(calories, floor);
}

function splitMacros({ calories, proteinRatio = 0.3, fatRatio = 0.25, carbRatio = 0.45 }) {
  const totalRatio = proteinRatio + fatRatio + carbRatio;
  assert.ok(Math.abs(totalRatio - 1) < 1e-9, 'Macro ratios must sum to 1');

  return {
    proteinGrams: (calories * proteinRatio) / 4,
    fatGrams: (calories * fatRatio) / 9,
    carbGrams: (calories * carbRatio) / 4,
  };
}

test('unit: BMR/TDEE baseline values', () => {
  const bmr = mifflinStJeorBmr({ sex: 'male', weightKg: 80, heightCm: 180, ageYears: 30 });
  assert.equal(Math.round(bmr), 1780);
  assert.equal(Math.round(tdee(bmr, 1.55)), 2759);
});

test('unit: deficit cap enforces <= 1% weekly loss equivalent', () => {
  const capped = dailyDeficitWithCap({ currentWeightKg: 70, targetDeficitKcalPerDay: 1500 });
  assert.ok(capped < 1500);
  assert.ok(capped <= 770 + 1e-9);
});

test('unit: calorie floors by sex are enforced', () => {
  assert.equal(applyCalorieFloor({ sex: 'female', calories: 950 }), 1200);
  assert.equal(applyCalorieFloor({ sex: 'male', calories: 1200 }), 1600);
  assert.equal(applyCalorieFloor({ sex: 'female', calories: 1500 }), 1500);
});

test('unit: macro split logic preserves calorie budget', () => {
  const calories = 2000;
  const macros = splitMacros({ calories });
  const reconstructed = macros.proteinGrams * 4 + macros.fatGrams * 9 + macros.carbGrams * 4;
  assert.ok(Math.abs(reconstructed - calories) < 1e-6);
});

test('edge/property: extreme low/high weights stay finite', () => {
  const inputs = [35, 50, 120, 250];
  for (const weightKg of inputs) {
    const bmr = mifflinStJeorBmr({ sex: 'female', weightKg, heightCm: 165, ageYears: 35 });
    assert.ok(Number.isFinite(bmr));
    assert.ok(bmr > 0);
  }
});

test('edge/property: age boundaries produce valid outputs', () => {
  for (const ageYears of [18, 30, 65, 90]) {
    const bmr = mifflinStJeorBmr({ sex: 'male', weightKg: 75, heightCm: 175, ageYears });
    assert.ok(Number.isFinite(bmr));
    assert.ok(bmr > 0);
  }
});

test('edge/property: aggressive goals always constrained by cap and floor', () => {
  const bmr = mifflinStJeorBmr({ sex: 'female', weightKg: 60, heightCm: 165, ageYears: 28 });
  const baseTdee = tdee(bmr, 1.4);

  const deficit = dailyDeficitWithCap({ currentWeightKg: 60, targetDeficitKcalPerDay: 2500 });
  const targetCalories = applyCalorieFloor({ sex: 'female', calories: baseTdee - deficit });

  assert.ok(deficit <= (60 * 0.01 * 7700) / 7 + 1e-9);
  assert.ok(targetCalories >= 1200);
});
