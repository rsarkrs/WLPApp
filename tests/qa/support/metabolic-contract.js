const fixtures = require('../../fixtures/metabolic-contract-fixtures.json');
const {
  computeBmrTdee,
  applyWeeklyCap,
  applyCalorieFloor,
  allocateMacros,
} = require('../../../src/domain/metabolicEngine');

const contextToFunction = {
  bmr_tdee: computeBmrTdee,
  weekly_cap: applyWeeklyCap,
  calorie_floor: applyCalorieFloor,
  macro_allocation: allocateMacros,
};

module.exports = {
  fixtures,
  contextToFunction,
  computeBmrTdeeContract: computeBmrTdee,
  applyWeeklyCapContract: applyWeeklyCap,
  applyCalorieFloorContract: applyCalorieFloor,
  allocateMacrosContract: allocateMacros,
};
