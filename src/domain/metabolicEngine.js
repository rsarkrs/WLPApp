const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
};

function normalizeNumber(value, precision = 9) {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function contractError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function assertSupportedSex(sex) {
  if (sex !== 'female' && sex !== 'male') {
    throw contractError('ERR_UNSUPPORTED_SEX', 'Unsupported sex value. Expected "female" or "male".');
  }
}

function computeBmrTdee({ sex, weightKg, heightCm, ageYears, activityLevel }) {
  assertSupportedSex(sex);

  if (ageYears < 18) {
    throw contractError('ERR_INVALID_AGE', 'ageYears must be >= 18.');
  }

  if (weightKg <= 0 || heightCm <= 0) {
    throw contractError('ERR_NON_POSITIVE_ANTHROPOMETRIC', 'heightCm and weightKg must be > 0.');
  }

  const activityMultiplier = activityMultipliers[activityLevel];
  if (!activityMultiplier) {
    throw contractError(
      'ERR_UNKNOWN_ACTIVITY_LEVEL',
      'Unknown activityLevel. Expected one of: sedentary, light, moderate, very.',
    );
  }

  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  const bmrRaw = sex === 'male' ? base + 5 : base - 161;

  return {
    bmrKcal: Math.round(bmrRaw),
    tdeeKcal: Math.round(bmrRaw * activityMultiplier),
    activityMultiplier,
    roundingPolicy: 'nearest_integer_half_up',
  };
}

function applyWeeklyCap({ currentWeightKg, requestedWeeklyLossKg }) {
  if (currentWeightKg <= 0) {
    throw contractError('ERR_NON_POSITIVE_BODY_WEIGHT', 'currentWeightKg must be > 0.');
  }

  if (requestedWeeklyLossKg < 0) {
    throw contractError('ERR_NEGATIVE_REQUESTED_LOSS', 'requestedWeeklyLossKg must be >= 0.');
  }

  const maxAllowedWeeklyLossKg = normalizeNumber(currentWeightKg * 0.01);
  const approvedWeeklyLossKg = normalizeNumber(Math.min(requestedWeeklyLossKg, maxAllowedWeeklyLossKg));

  return {
    approvedWeeklyLossKg,
    maxAllowedWeeklyLossKg,
    appliedCap: requestedWeeklyLossKg > maxAllowedWeeklyLossKg,
  };
}

function applyCalorieFloor({ sex, proposedDailyCalories }) {
  assertSupportedSex(sex);

  if (proposedDailyCalories <= 0) {
    throw contractError('ERR_NON_POSITIVE_CALORIES', 'proposedDailyCalories must be > 0.');
  }

  const floorCalories = sex === 'male' ? 1600 : 1200;
  return {
    finalDailyCalories: Math.max(proposedDailyCalories, floorCalories),
    floorCalories,
    floorApplied: proposedDailyCalories < floorCalories,
  };
}

function allocateMacros({ dailyCalories, weightKg }) {
  if (dailyCalories <= 0) {
    throw contractError('ERR_NON_POSITIVE_DAILY_CALORIES', 'dailyCalories must be > 0.');
  }

  if (weightKg <= 0) {
    throw contractError('ERR_NON_POSITIVE_BODY_WEIGHT', 'weightKg must be > 0.');
  }

  const proteinG = Math.round(weightKg * 2);
  const fatG = Math.round(weightKg * 0.8);
  const usedCalories = proteinG * 4 + fatG * 9;

  if (usedCalories <= dailyCalories) {
    const carbG = Math.round((dailyCalories - usedCalories) / 4);
    const residualCalories = dailyCalories - (proteinG * 4 + fatG * 9 + carbG * 4);

    return {
      proteinG,
      fatG,
      carbG,
      strategyUsed: 'protein2gkg_fat0.8gkg_then_carbs',
      fallbackApplied: false,
      fallbackReasonCode: null,
      residualCalories,
    };
  }

  const fallbackProteinG = Math.round((dailyCalories * 0.3) / 4);
  const fallbackFatG = Math.round((dailyCalories * 0.3) / 9);
  const fallbackCarbG = Math.round((dailyCalories * 0.4) / 4);

  return {
    proteinG: fallbackProteinG,
    fatG: fallbackFatG,
    carbG: fallbackCarbG,
    strategyUsed: 'balanced_30_30_40_fallback',
    fallbackApplied: true,
    fallbackReasonCode: 'ERR_INFEASIBLE_MACRO_CONSTRAINTS',
    residualCalories: dailyCalories - (fallbackProteinG * 4 + fallbackFatG * 9 + fallbackCarbG * 4),
  };
}

module.exports = {
  activityMultipliers,
  computeBmrTdee,
  applyWeeklyCap,
  applyCalorieFloor,
  allocateMacros,
};
