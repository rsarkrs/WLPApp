const profiles = new Map();
const planningRequests = new Map();


const importRuns = new Map();
const importHashIndex = new Map();
let importCounter = 0;

function nextImportRunId() {
  importCounter += 1;
  return `imp-${importCounter}`;
}

function saveImportRun(run) {
  importRuns.set(run.id, run);
  if (run.recipeHash) {
    importHashIndex.set(run.recipeHash, run.id);
  }
  return run;
}

function getImportRun(id) {
  return importRuns.get(id) || null;
}

function findImportRunByHash(recipeHash) {
  const id = importHashIndex.get(recipeHash);
  if (!id) return null;
  return importRuns.get(id) || null;
}

function profileKey(householdId, memberId) {
  return `${householdId}::${memberId}`;
}

function upsertProfile(payload) {
  const key = profileKey(payload.householdId, payload.memberId);
  const record = {
    householdId: payload.householdId,
    memberId: payload.memberId,
    sex: payload.sex,
    ageYears: payload.ageYears,
    heightCm: payload.heightCm,
    weightKg: payload.weightKg,
    activityLevel: payload.activityLevel,
    targetDailyCalories: payload.targetDailyCalories,
    requestedWeeklyLossKg: payload.requestedWeeklyLossKg,
    updatedAt: new Date().toISOString(),
  };

  profiles.set(key, record);
  return record;
}

function getProfile(householdId, memberId) {
  return profiles.get(profileKey(householdId, memberId)) || null;
}

function getPlanningResult(idempotencyKey) {
  return planningRequests.get(idempotencyKey) || null;
}

function savePlanningResult(idempotencyKey, result) {
  planningRequests.set(idempotencyKey, result);
  return result;
}

module.exports = {
  upsertProfile,
  getProfile,
  getPlanningResult,
  savePlanningResult,
  nextImportRunId,
  saveImportRun,
  getImportRun,
  findImportRunByHash,
};
