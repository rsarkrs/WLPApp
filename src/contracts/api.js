function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateProfileResponse(value) {
  if (!isObject(value)) return false;
  return typeof value.householdId === 'string'
    && typeof value.memberId === 'string'
    && typeof value.sex === 'string';
}

function validatePlanPreviewResponse(value) {
  if (!isObject(value) || !isObject(value.plan) || !isObject(value.safety)) return false;
  if (!Array.isArray(value.plan.meals)) return false;
  if (!isObject(value.safety.calorie) || !isObject(value.safety.weeklyCap) || !isObject(value.safety.targetMacros)) return false;

  return value.plan.meals.every((meal) => (
    isObject(meal)
    && typeof meal.day === 'number'
    && typeof meal.recipeId === 'string'
    && typeof meal.recipeName === 'string'
    && isObject(meal.macros)
  ));
}

function validateShoppingPreviewResponse(value) {
  if (!isObject(value)) return false;
  if (!Array.isArray(value.pantryExclusions) || typeof value.totalItems !== 'number' || !Array.isArray(value.items)) {
    return false;
  }

  return value.items.every((item) => (
    isObject(item)
    && typeof item.name === 'string'
    && typeof item.unit === 'string'
    && (typeof item.qty === 'number' || typeof item.quantity === 'number')
  ));
}

function validateImportRunResponse(value) {
  if (!isObject(value)) return false;

  if (value.importStatus === 'duplicate') {
    return typeof value.id === 'string'
      && typeof value.duplicateOf === 'string'
      && isObject(value.sourceAttribution)
      && isObject(value.dedupe);
  }

  return typeof value.id === 'string'
    && typeof value.importStatus === 'string'
    && Array.isArray(value.errors)
    && Array.isArray(value.warnings)
    && isObject(value.sourceAttribution)
    && isObject(value.dedupe)
    && typeof value.createdAt === 'string';
}

function validateErrorResponse(value) {
  if (!isObject(value)) return false;

  if (isObject(value.error)) {
    return typeof value.error.code === 'string' && typeof value.error.message === 'string';
  }

  return typeof value.code === 'string' && typeof value.message === 'string';
}

module.exports = {
  validateProfileResponse,
  validatePlanPreviewResponse,
  validateShoppingPreviewResponse,
  validateImportRunResponse,
  validateErrorResponse,
};
