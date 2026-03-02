import { useEffect, useMemo, useState } from 'react';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealSlots = ['breakfast', 'lunch', 'dinner'];
const cuisineOptions = ['american', 'mediterranean', 'italian', 'chinese', 'korean'];
const defaultActivity = 'moderate';
const localStateKey = 'wlpapp-local-state-v1';
const maxMembers = 3;
const launchReadinessChecklist = [
  'Profile + goals setup can be completed without errors.',
  'Weekly planner generation succeeds with at least one household member selected.',
  'Shopping list export produces valid JSON output.',
  'Internal Android/TWA release packet checks pass in CI before internal rollout.'
];


function makeProfile(memberId, friendlyName = 'Member') {
  return {
    householdId: 'hh-demo',
    memberId,
    friendlyName,
    sex: 'male',
    ageYears: '35',
    activityLevel: defaultActivity,
    unitSystem: 'imperial',
    weight: '350',
    heightPrimary: '6',
    heightSecondary: '1',
    requestedWeeklyLoss: '1.1',
    targetDailyCalories: '2500',
  };
}

function labelCase(value = '') {
  return value.slice(0, 1).toUpperCase() + value.slice(1);
}

function emptyWeek() {
  return dayNames.map((dayName, index) => ({
    day: index + 1,
    dayName,
    meals: [null, null, null],
  }));
}

function toWeekGrid(planDays = []) {
  return emptyWeek().map((day) => {
    const source = planDays.find((item) => item.day === day.day);
    if (!source) return day;

    const meals = [null, null, null];
    for (const meal of source.meals || []) {
      if (meal.slot === 'breakfast') meals[0] = meal;
      if (meal.slot === 'lunch') meals[1] = meal;
      if (meal.slot === 'dinner') meals[2] = meal;
    }

    return { ...day, meals };
  });
}

function estimateCalories(macros) {
  return Math.round((macros.proteinG * 4) + (macros.carbG * 4) + (macros.fatG * 9));
}

function scaleMacros(macros, scale) {
  return {
    proteinG: Math.round(macros.proteinG * scale),
    fatG: Math.round(macros.fatG * scale),
    carbG: Math.round(macros.carbG * scale),
  };
}

function lbToKg(value) {
  return Number(value) * 0.45359237;
}

function kgToLb(value) {
  return Number(value) / 0.45359237;
}

function ftInToCm(feet, inches) {
  return ((Number(feet) * 12) + Number(inches)) * 2.54;
}

function cmToFtIn(cm) {
  const totalInches = Number(cm) / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Number((totalInches - (feet * 12)).toFixed(1));
  return { feet, inches };
}


function weekAverageCalories(weekPlan, scale) {
  const daysWithMeals = weekPlan.filter((day) => day.meals.some(Boolean));
  if (daysWithMeals.length === 0) return 0;
  const total = daysWithMeals.reduce((sum, day) => {
    const dayCalories = (day.meals || []).filter(Boolean).reduce((mealSum, meal) => {
      const scaled = scaleMacros(meal.macros, scale);
      return mealSum + estimateCalories(scaled);
    }, 0);
    return sum + dayCalories;
  }, 0);
  return total / daysWithMeals.length;
}

function calibrateScaleToTarget(weekPlan, baseScale, targetCalories) {
  const currentAverage = weekAverageCalories(weekPlan, baseScale);
  if (!Number.isFinite(currentAverage) || currentAverage <= 0) {
    return { scale: baseScale, averageCalories: 0 };
  }

  const ratio = Number(targetCalories) / currentAverage;
  const calibrated = Math.max(0.25, Math.min(3, baseScale * ratio));
  return {
    scale: calibrated,
    averageCalories: Math.round(weekAverageCalories(weekPlan, calibrated)),
  };
}

function normalizeProfileToMetric(profile) {
  if (profile.unitSystem === 'metric') {
    return {
      weightKg: Number(profile.weight),
      heightCm: Number(profile.heightPrimary),
      requestedWeeklyLossKg: Number(profile.requestedWeeklyLoss),
    };
  }

  return {
    weightKg: Number(lbToKg(profile.weight).toFixed(1)),
    heightCm: Number(ftInToCm(profile.heightPrimary, profile.heightSecondary).toFixed(1)),
    requestedWeeklyLossKg: Number(lbToKg(profile.requestedWeeklyLoss).toFixed(2)),
  };
}

function convertProfileUnit(profile, nextUnit) {
  if (profile.unitSystem === nextUnit) return profile;

  if (nextUnit === 'metric') {
    return {
      ...profile,
      unitSystem: 'metric',
      weight: String(Number(lbToKg(profile.weight).toFixed(1))),
      heightPrimary: String(Number(ftInToCm(profile.heightPrimary, profile.heightSecondary).toFixed(1))),
      heightSecondary: '',
      requestedWeeklyLoss: String(Number(lbToKg(profile.requestedWeeklyLoss).toFixed(2))),
    };
  }

  const imperial = cmToFtIn(profile.heightPrimary);
  return {
    ...profile,
    unitSystem: 'imperial',
    weight: String(Number(kgToLb(profile.weight).toFixed(1))),
    heightPrimary: String(imperial.feet),
    heightSecondary: String(imperial.inches),
    requestedWeeklyLoss: String(Number(kgToLb(profile.requestedWeeklyLoss).toFixed(2))),
  };
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [profiles, setProfiles] = useState([makeProfile('member-1', 'Member 1'), makeProfile('member-2', 'Member 2')]);
  const [activeProfileTab, setActiveProfileTab] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Save each member profile before generating the planner.');
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [seed, setSeed] = useState(0);
  const [plannerMessage, setPlannerMessage] = useState('Generate a weekly planner and drag/drop cards to reorganize.');
  const [weekPlan, setWeekPlan] = useState(emptyWeek());
  const [dragSource, setDragSource] = useState(null);
  const [mealBank, setMealBank] = useState([]);
  const [shoppingMessage, setShoppingMessage] = useState('Generate categorized totals for unique shopping items.');
  const [shoppingRows, setShoppingRows] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [preferences, setPreferences] = useState({
    cuisines: [],
    excludedIngredients: [],
  });
  const [selectedIngredientsByType, setSelectedIngredientsByType] = useState({});
  const [selectedExcludedIngredients, setSelectedExcludedIngredients] = useState([]);
  const [selectedPlannerMemberId, setSelectedPlannerMemberId] = useState('');
  const [swapDialog, setSwapDialog] = useState({ open: false, dayIndex: -1, mealIndex: -1, meal: null, selectedRecipeId: '' });
  const [undoSwapState, setUndoSwapState] = useState(null);
  const [isMobileNav, setIsMobileNav] = useState(true);

  const apiBase = useMemo(() => '/api', []);
  const editableProfiles = profiles;

  const activeProfiles = useMemo(() => {
    if (selectedMembers.length > 0) {
      return savedProfiles.filter((item) => selectedMembers.includes(item.memberId));
    }
    return editableProfiles.map((profile) => ({
      ...profile,
      targetDailyCalories: Number(profile.targetDailyCalories || 2000),
    }));
  }, [editableProfiles, savedProfiles, selectedMembers]);

  const profileScales = useMemo(
    () => activeProfiles.map((profile) => ({
      memberId: profile.memberId,
      friendlyName: profile.friendlyName,
      targetDailyCalories: Number(profile.targetDailyCalories || 2000),
      baseScale: Math.max(Number(profile.targetDailyCalories || 2000), 1) / 2000,
    })),
    [activeProfiles]
  );

  const calibratedProfileScales = useMemo(
    () => profileScales.map((item) => {
      const calibrated = calibrateScaleToTarget(weekPlan, item.baseScale, item.targetDailyCalories);
      return {
        memberId: item.memberId,
        scale: calibrated.scale,
        targetDailyCalories: item.targetDailyCalories,
        averageCalories: calibrated.averageCalories,
      };
    }),
    [profileScales, weekPlan]
  );

  useEffect(() => {
    if (calibratedProfileScales.length === 0) return;
    const exists = calibratedProfileScales.some((item) => item.memberId === selectedPlannerMemberId);
    if (!exists) {
      setSelectedPlannerMemberId(calibratedProfileScales[0].memberId);
    }
  }, [calibratedProfileScales, selectedPlannerMemberId]);

  function selectedPlannerScale() {
    return calibratedProfileScales.find((item) => item.memberId === selectedPlannerMemberId) || calibratedProfileScales[0] || { memberId: 'member-1', scale: 1, targetDailyCalories: 2000, averageCalories: 0 };
  }


  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 768px)');
    const apply = () => setIsMobileNav(media.matches);
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const parsed = JSON.parse(window.localStorage.getItem(localStateKey) || 'null');
      if (!parsed) return;

      if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) setProfiles(parsed.profiles.slice(0, maxMembers).map((item, index) => ({ ...item, friendlyName: item.friendlyName || `Member ${index + 1}` })));
      if (Array.isArray(parsed.savedProfiles)) setSavedProfiles(parsed.savedProfiles.slice(0, maxMembers));
      if (Array.isArray(parsed.selectedMembers)) setSelectedMembers(parsed.selectedMembers.slice(0, maxMembers));
      if (Array.isArray(parsed.weekPlan)) setWeekPlan(parsed.weekPlan);
      if (Array.isArray(parsed.mealBank)) setMealBank(parsed.mealBank);
      if (parsed.preferences) setPreferences(parsed.preferences);
      if (typeof parsed.selectedRecipeId === 'string') setSelectedRecipeId(parsed.selectedRecipeId);
      if (typeof parsed.seed === 'number') setSeed(parsed.seed);
      if (typeof parsed.selectedPlannerMemberId === 'string') setSelectedPlannerMemberId(parsed.selectedPlannerMemberId);
      setStatusMessage('Loaded local profile/planner data from this device.');
    } catch (_error) {
      setStatusMessage('Local profile data could not be restored.');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      localStateKey,
      JSON.stringify({
        profiles,
        savedProfiles,
        selectedMembers,
        weekPlan,
        mealBank,
        preferences,
        selectedRecipeId,
        seed,
        selectedPlannerMemberId,
      })
    );
  }, [
    profiles,
    savedProfiles,
    selectedMembers,
    weekPlan,
    mealBank,
    preferences,
    selectedRecipeId,
    seed,
    selectedPlannerMemberId,
  ]);

  function updateProfile(index, patch) {
    setProfiles((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function updateProfileUnit(index, nextUnit) {
    setProfiles((current) => current.map((item, i) => (i === index ? convertProfileUnit(item, nextUnit) : item)));
  }

  async function calculateTargetCalories(index) {
    const profile = profiles[index];
    const metric = normalizeProfileToMetric(profile);

    try {
      const params = new URLSearchParams({
        sex: profile.sex,
        ageYears: String(Number(profile.ageYears)),
        heightCm: String(metric.heightCm),
        weightKg: String(metric.weightKg),
        activityLevel: profile.activityLevel,
      });

      const response = await fetch(`${apiBase}/v1/metabolic/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Could not calculate target');

      const deficit = (metric.requestedWeeklyLossKg * 7700) / 7;
      const floor = profile.sex === 'male' ? 1600 : 1200;
      const target = Math.max(Math.round(body.tdeeKcal - deficit), floor);
      updateProfile(index, { targetDailyCalories: String(target) });
      setStatusMessage(`Calculated target calories for ${profile.memberId}: ${target} kcal/day.`);
    } catch (error) {
      setStatusMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function saveProfile(index) {
    const profile = profiles[index];
    const metric = normalizeProfileToMetric(profile);

    const payload = {
      householdId: profile.householdId,
      memberId: profile.memberId,
      friendlyName: profile.friendlyName,
      sex: profile.sex,
      ageYears: Number(profile.ageYears),
      activityLevel: profile.activityLevel,
      heightCm: metric.heightCm,
      weightKg: metric.weightKg,
      targetDailyCalories: Number(profile.targetDailyCalories),
      requestedWeeklyLossKg: metric.requestedWeeklyLossKg,
    };

    setSavedProfiles((current) => {
      const without = current.filter((item) => item.memberId !== payload.memberId);
      const next = [...without, payload];
      next.sort((a, b) => a.memberId.localeCompare(b.memberId));
      return next;
    });
    setSelectedMembers((current) => {
      const without = current.filter((item) => item !== payload.memberId);
      return [...without, payload.memberId].slice(0, maxMembers);
    });
    setStatusMessage(`Saved ${payload.memberId} locally on this device.`);
  }

  async function loadProfiles() {
    setSelectedMembers(savedProfiles.slice(0, maxMembers).map((item) => item.memberId));
    setStatusMessage(`Loaded ${savedProfiles.length} locally saved profile(s).`);
  }

  function addMember() {
    if (profiles.length >= maxMembers) return;
    const next = profiles.length + 1;
    setProfiles((current) => [...current, makeProfile(`member-${next}`, `Member ${next}`)]);
    setActiveProfileTab(profiles.length);
  }

  function removeMember(index) {
    if (profiles.length <= 1) return;
    const memberId = profiles[index]?.memberId;
    setProfiles((current) => current.filter((_, i) => i !== index));
    setSavedProfiles((current) => current.filter((item) => item.memberId !== memberId));
    setSelectedMembers((current) => current.filter((item) => item !== memberId));
    setActiveProfileTab((current) => Math.max(0, Math.min(current, profiles.length - 2)));
    setStatusMessage('Removed member profile.');
  }

  function cuisinesQuery() {
    return preferences.cuisines.join(',');
  }

  async function loadMealBank() {
    const query = new URLSearchParams();
    if (preferences.cuisines.length > 0) query.set('cuisine', cuisinesQuery());
    if (preferences.excludedIngredients.length > 0) query.set('excludeIngredient', preferences.excludedIngredients.join(','));

    const response = await fetch(`${apiBase}/v1/recipes?${query.toString()}`);
    const body = await response.json();
    if (!response.ok) {
      setPlannerMessage(body.message || body.code || 'Unable to load meal bank');
      return [];
    }

    setMealBank(body.items || []);
    return body.items || [];
  }

  async function generatePlan(nextSeed = seed) {
    setPlannerMessage('Generating weekly planner preview...');
    if (mealBank.length === 0) {
      await loadMealBank();
    }

    const primaryProfile = profiles[0];
    const metric = normalizeProfileToMetric(primaryProfile);

    const params = new URLSearchParams({
      seed: String(nextSeed),
      sex: primaryProfile.sex,
      dailyCalories: String(Number(primaryProfile.targetDailyCalories)),
      weightKg: String(metric.weightKg),
      requestedWeeklyLossKg: String(metric.requestedWeeklyLossKg),
    });

    if (preferences.cuisines.length > 0) params.set('cuisine', cuisinesQuery());
    if (preferences.excludedIngredients.length > 0) params.set('excludeIngredient', preferences.excludedIngredients.join(','));

    try {
      const response = await fetch(`${apiBase}/v1/plans/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Planner preview failed');

      const week = toWeekGrid(body.plan.days || []);
      setWeekPlan(week);
      const plannedRecipeIds = [...new Set(week.flatMap((day) => day.meals.filter(Boolean).map((meal) => meal.recipeId)))];
      setSelectedRecipeId(plannedRecipeIds[0] || '');
      setPlannerMessage(
        plannedRecipeIds.length === 0
          ? 'No recipes matched your current preferences. Clear filters and regenerate.'
          : 'Planner generated with preferences. Drag cards or meal-bank items to reorganize.'
      );
    } catch (error) {
      setPlannerMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API planner endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function regeneratePlan() {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    await generatePlan(nextSeed);
  }

  function onDragStart(source) {
    setDragSource(source);
  }

  function onDrop(dayIndex, mealIndex) {
    if (!dragSource) return;

    if (dragSource.kind === 'slot') {
      setWeekPlan((current) => {
        const clone = current.map((day) => ({ ...day, meals: [...day.meals] }));
        const from = clone[dragSource.dayIndex].meals[dragSource.mealIndex];
        const to = clone[dayIndex].meals[mealIndex];
        clone[dragSource.dayIndex].meals[dragSource.mealIndex] = to;
        clone[dayIndex].meals[mealIndex] = from;
        return clone;
      });
      setPlannerMessage('Swapped meal cards.');
      setDragSource(null);
      return;
    }

    if (dragSource.kind === 'bank') {
      setWeekPlan((current) => {
        const clone = current.map((day) => ({ ...day, meals: [...day.meals] }));
        const slot = mealSlots[mealIndex];
        clone[dayIndex].meals[mealIndex] = {
          day: dayIndex + 1,
          slot,
          recipeId: dragSource.recipe.id,
          recipeName: dragSource.recipe.name,
          macros: dragSource.recipe.macros,
          selectionReason: 'meal_bank_drag_drop',
        };
        return clone;
      });
      setPlannerMessage('Dropped meal from meal bank into planner.');
      setDragSource(null);
    }
  }

  function openSwapDialog(dayIndex, mealIndex, meal) {
    if (!meal) return;
    setSwapDialog({ open: true, dayIndex, mealIndex, meal, selectedRecipeId: '' });
  }

  function applyMealSwap(mode) {
    const selected = mealBank.find((item) => item.id === swapDialog.selectedRecipeId);
    if (!selected || !swapDialog.meal) return;

    const nextMeal = {
      day: swapDialog.dayIndex + 1,
      slot: swapDialog.meal.slot,
      recipeId: selected.id,
      recipeName: selected.name,
      macros: selected.macros,
      selectionReason: mode === 'all' ? 'swap_all_same_recipe' : 'swap_single_day',
    };

    setWeekPlan((current) => {
      const before = current.map((day) => ({ ...day, meals: [...day.meals] }));
      const updated = before.map((day) => ({ ...day, meals: [...day.meals] }));
      if (mode === 'all') {
        updated.forEach((day, dIdx) => {
          day.meals = day.meals.map((meal, mIdx) => {
            if (!meal) return meal;
            if (meal.recipeId !== swapDialog.meal.recipeId || meal.slot !== swapDialog.meal.slot) return meal;
            return { ...nextMeal, day: dIdx + 1, slot: mealSlots[mIdx] };
          });
        });
      } else {
        updated[swapDialog.dayIndex].meals[swapDialog.mealIndex] = nextMeal;
      }
      setUndoSwapState(before);
      return updated;
    });

    setPlannerMessage(`Replaced ${swapDialog.meal.recipeName} with ${selected.name}.`);
    setSwapDialog({ open: false, dayIndex: -1, mealIndex: -1, meal: null, selectedRecipeId: '' });
  }

  function undoLastSwap() {
    if (!undoSwapState) return;
    setWeekPlan(undoSwapState);
    setUndoSwapState(null);
    setPlannerMessage('Undid last meal swap.');
  }

  function dayTotalsForScale(meals, scale) {
    return meals.filter(Boolean).reduce((acc, meal) => {
      const scaled = scaleMacros(meal.macros, scale);
      acc.protein += scaled.proteinG;
      acc.fat += scaled.fatG;
      acc.carbs += scaled.carbG;
      acc.calories += estimateCalories(scaled);
      return acc;
    }, { protein: 0, fat: 0, carbs: 0, calories: 0 });
  }

  async function generateShoppingList() {
    setShoppingMessage('Generating categorized shopping summary...');
    const primaryProfile = profiles[0];
    const metric = normalizeProfileToMetric(primaryProfile);

    const params = new URLSearchParams({
      seed: String(seed),
      sex: primaryProfile.sex,
      dailyCalories: String(Number(primaryProfile.targetDailyCalories)),
      weightKg: String(metric.weightKg),
      requestedWeeklyLossKg: String(metric.requestedWeeklyLossKg),
    });

    if (preferences.cuisines.length > 0) params.set('cuisine', cuisinesQuery());
    if (preferences.excludedIngredients.length > 0) params.set('excludeIngredient', preferences.excludedIngredients.join(','));

    try {
      const response = await fetch(`${apiBase}/v1/shopping/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Shopping preview failed');

      const householdScale = calibratedProfileScales.reduce((sum, item) => sum + item.scale, 0);
      const rows = [];
      for (const [category, items] of Object.entries(body.byCategory || {})) {
        for (const item of items) {
          rows.push({
            category,
            name: item.name,
            qty: normalizeQtyForUnit(item.qty * householdScale, item.unit),
            unit: item.unit,
          });
        }
      }

      setShoppingRows(rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      setShoppingMessage(`Generated shopping totals for ${calibratedProfileScales.length} active member(s).`);
    } catch (error) {
      setShoppingMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API shopping endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  function exportShoppingList() {
    const data = {
      generatedAt: new Date().toISOString(),
      seed,
      selectedMembers,
      rows: shoppingRows,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'wlpapp-shopping-list.json';
    anchor.click();
    URL.revokeObjectURL(url);
    setShoppingMessage('Exported shopping list JSON.');
  }

  const plannedRecipeIds = useMemo(
    () => [...new Set(weekPlan.flatMap((day) => day.meals.filter(Boolean).map((meal) => meal.recipeId)))],
    [weekPlan]
  );

  const selectedRecipe = useMemo(() => {
    if (!selectedRecipeId) return null;
    return mealBank.find((item) => item.id === selectedRecipeId) || null;
  }, [mealBank, selectedRecipeId]);

  const ingredientTypeMap = useMemo(() => {
    const grouped = {};
    for (const recipe of mealBank) {
      for (const ingredient of recipe.ingredients || []) {
        const type = ingredient.category || 'other';
        if (!grouped[type]) grouped[type] = new Set();
        grouped[type].add(ingredient.name);
      }
    }

    const normalized = {};
    for (const [type, names] of Object.entries(grouped)) {
      normalized[type] = [...names].sort((a, b) => a.localeCompare(b));
    }
    return normalized;
  }, [mealBank]);

  const selectableSwapRecipes = useMemo(() => {
    if (!swapDialog.meal) return [];
    return mealBank.filter((item) => item.mealType === swapDialog.meal.slot);
  }, [mealBank, swapDialog]);

  function addExcludedIngredients() {
    const selected = Object.values(selectedIngredientsByType).flat();
    if (selected.length === 0) return;
    const merged = [...new Set([...preferences.excludedIngredients, ...selected])].sort((a, b) => a.localeCompare(b));
    setPreferences({ ...preferences, excludedIngredients: merged });
    setSelectedIngredientsByType({});
  }

  function removeExcludedIngredients() {
    if (selectedExcludedIngredients.length === 0) return;
    setPreferences({
      ...preferences,
      excludedIngredients: preferences.excludedIngredients.filter((item) => !selectedExcludedIngredients.includes(item)),
    });
    setSelectedExcludedIngredients([]);
  }

  function normalizeQtyForUnit(qty, unit) {
    if (unit === 'item') {
      return Math.max(1, Math.round(qty));
    }
    return Number(qty.toFixed(2));
  }


  function tabButton(tab, label) {
    const selected = activeTab === tab;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(tab)}
        style={{
          borderRadius: '999px',
          border: selected ? '1px solid #4c63d2' : '1px solid #d2d7ef',
          background: selected ? '#4c63d2' : '#eef1ff',
          color: selected ? 'white' : '#233',
          padding: '0.45rem 0.9rem',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );
  }

  const surfaceStyle = {
    border: '1px solid #dce2f7',
    background: '#f8faff',
    borderRadius: '10px',
    padding: '1rem',
  };

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '1rem auto', maxWidth: '1400px', color: '#1f2438', paddingBottom: isMobileNav ? '5rem' : '1rem' }}>
      <h1>WLPApp Web Scaffold</h1>
      <p><strong>Internal Launch UI Beta:</strong> Phase 10 MVP flows are active and later phases harden release-readiness automation.</p>
      <p>API target: <code>/api</code> (used for calculations/meal generation only; profile data is local-storage only)</p>

      <section style={{ ...surfaceStyle, marginBottom: '1rem', background: '#eef3ff' }}>
        <h2 style={{ marginTop: 0 }}>Internal launch status</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: '0.6rem' }}>
          <div style={{ background: 'white', border: '1px solid #d5ddff', borderRadius: '8px', padding: '0.6rem' }}>
            <strong>UI Surface</strong>
            <div>Phase 10 MVP complete</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #d5ddff', borderRadius: '8px', padding: '0.6rem' }}>
            <strong>QA / Release Gates</strong>
            <div>Phases 11+ automated</div>
          </div>
          <div style={{ background: 'white', border: '1px solid #d5ddff', borderRadius: '8px', padding: '0.6rem' }}>
            <strong>Android Track</strong>
            <div>TWA + release packet pipeline</div>
          </div>
        </div>
      </section>

      <div style={isMobileNav
        ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 15, display: 'flex', justifyContent: 'space-around', gap: '0.25rem', padding: '0.5rem', marginBottom: 0, flexWrap: 'nowrap', background: '#ffffff', borderTop: '1px solid #dce2f7' }
        : { display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {tabButton('profile', 'Profile and Goals')}
        {tabButton('planner', 'Weekly Planner')}
        {tabButton('recipes', 'Recipes Used')}
        {tabButton('shopping', 'Shopping List')}
        {tabButton('launch', 'Internal Launch Checklist')}
      </div>

      {activeTab === 'profile' && (
        <section style={surfaceStyle}>
          <h2>Profile and goal setup</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            {profiles.map((profile, index) => (
              <button
                key={`member-tab-${profile.memberId}-${index}`}
                type="button"
                onClick={() => setActiveProfileTab(index)}
                style={{
                  borderRadius: '999px',
                  border: activeProfileTab === index ? '1px solid #4c63d2' : '1px solid #d2d7ef',
                  background: activeProfileTab === index ? '#4c63d2' : '#eef1ff',
                  color: activeProfileTab === index ? 'white' : '#233',
                  padding: '0.45rem 0.9rem',
                  cursor: 'pointer',
                }}
              >
                {profile.friendlyName || `Member ${index + 1}`}
              </button>
            ))}
            <button type="button" onClick={addMember} disabled={profiles.length >= maxMembers}>+ Add member</button>
          </div>

          {profiles[activeProfileTab] && (
            <div style={{ border: '1px solid #ccd4f0', borderRadius: '8px', padding: '0.75rem', background: 'white' }}>
              <h3 style={{ marginTop: 0 }}>{profiles[activeProfileTab].friendlyName || `Member ${activeProfileTab + 1}`}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '0.6rem' }}>
                <label>Friendly name<input style={{ width: '100%' }} value={profiles[activeProfileTab].friendlyName || ''} onChange={(e) => updateProfile(activeProfileTab, { friendlyName: e.target.value })} /></label>
                <label>Household ID<input style={{ width: '100%' }} value={profiles[activeProfileTab].householdId} onChange={(e) => updateProfile(activeProfileTab, { householdId: e.target.value })} /></label>
                <label>Member ID<input style={{ width: '100%' }} value={profiles[activeProfileTab].memberId} onChange={(e) => updateProfile(activeProfileTab, { memberId: e.target.value })} /></label>
                <label>Sex<select style={{ width: '100%' }} value={profiles[activeProfileTab].sex} onChange={(e) => updateProfile(activeProfileTab, { sex: e.target.value })}><option value="female">female</option><option value="male">male</option></select></label>
                <label>Age<input style={{ width: '100%' }} type="number" min="18" value={profiles[activeProfileTab].ageYears} onChange={(e) => updateProfile(activeProfileTab, { ageYears: e.target.value })} /></label>
                <label>Activity<select style={{ width: '100%' }} value={profiles[activeProfileTab].activityLevel} onChange={(e) => updateProfile(activeProfileTab, { activityLevel: e.target.value })}><option value="sedentary">sedentary</option><option value="light">light</option><option value="moderate">moderate</option><option value="active">active</option><option value="very_active">very_active</option></select></label>
                <label>Units<select style={{ width: '100%' }} value={profiles[activeProfileTab].unitSystem} onChange={(e) => updateProfileUnit(activeProfileTab, e.target.value)}><option value="imperial">imperial</option><option value="metric">metric</option></select></label>
                <label>Weight ({profiles[activeProfileTab].unitSystem === 'imperial' ? 'lbs' : 'kg'})<input style={{ width: '100%' }} type="number" value={profiles[activeProfileTab].weight} onChange={(e) => updateProfile(activeProfileTab, { weight: e.target.value })} /></label>
                <label>Height ({profiles[activeProfileTab].unitSystem === 'imperial' ? 'ft' : 'cm'})<input style={{ width: '100%' }} type="number" value={profiles[activeProfileTab].heightPrimary} onChange={(e) => updateProfile(activeProfileTab, { heightPrimary: e.target.value })} /></label>
                <label>Height ({profiles[activeProfileTab].unitSystem === 'imperial' ? 'in' : 'secondary'})<input style={{ width: '100%' }} type="number" value={profiles[activeProfileTab].heightSecondary} disabled={profiles[activeProfileTab].unitSystem !== 'imperial'} onChange={(e) => updateProfile(activeProfileTab, { heightSecondary: e.target.value })} /></label>
                <label>Requested weekly loss ({profiles[activeProfileTab].unitSystem === 'imperial' ? 'lbs' : 'kg'})<input style={{ width: '100%' }} type="number" step="0.1" value={profiles[activeProfileTab].requestedWeeklyLoss} onChange={(e) => updateProfile(activeProfileTab, { requestedWeeklyLoss: e.target.value })} /></label>
                <label>Target calories<input style={{ width: '100%' }} type="number" value={profiles[activeProfileTab].targetDailyCalories} readOnly /></label>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
                <button type="button" onClick={() => calculateTargetCalories(activeProfileTab)}>Calculate target calories</button>
                <button type="button" onClick={() => saveProfile(activeProfileTab)}>Save member</button>
                <button type="button" onClick={() => removeMember(activeProfileTab)} disabled={profiles.length <= 1}>Remove member</button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={() => loadProfiles()}>Load saved profiles (local)</button>
            <p aria-live="polite">{statusMessage}</p>
            <p><strong>Members used for planner scaling (select up to {maxMembers}):</strong></p>
            <ul>
              {savedProfiles.map((item) => (
                <li key={item.memberId}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(item.memberId)}
                      onChange={() => setSelectedMembers((current) => {
                        if (current.includes(item.memberId)) return current.filter((id) => id !== item.memberId);
                        const next = [...current, item.memberId];
                        return next.slice(0, maxMembers);
                      })}
                    />
                    {item.friendlyName || item.memberId} ({item.targetDailyCalories} kcal)
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {activeTab === 'planner' && (
        <section style={surfaceStyle}>
          <h2>Weekly planner view</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: '0.6rem', marginBottom: '0.7rem' }}>
            <label>
              Preferred cuisines (multi-select)
              <select
                multiple
                size={5}
                style={{ width: '100%' }}
                value={preferences.cuisines}
                onChange={(event) => {
                  const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                  setPreferences({ ...preferences, cuisines: values });
                }}
              >
                {cuisineOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <div style={{ border: '1px solid #d8ddf5', borderRadius: '8px', padding: '0.5rem', background: 'white' }}>
              <strong>Ingredients by type</strong>
              {Object.keys(ingredientTypeMap).length === 0 && <div style={{ color: '#5b6075', marginTop: '0.4rem' }}>Load meal bank first to populate ingredient groups.</div>}
              {Object.entries(ingredientTypeMap).map(([type, ingredients]) => (
                <label key={type} style={{ display: 'block', marginTop: '0.45rem' }}>
                  {labelCase(type)}
                  <select
                    multiple
                    size={4}
                    style={{ width: '100%' }}
                    value={selectedIngredientsByType[type] || []}
                    onChange={(event) => {
                      const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                      setSelectedIngredientsByType({ ...selectedIngredientsByType, [type]: values });
                    }}
                  >
                    {ingredients.map((ingredient) => <option key={`${type}-${ingredient}`} value={ingredient}>{ingredient}</option>)}
                  </select>
                </label>
              ))}
              <button type="button" style={{ marginTop: '0.45rem' }} onClick={addExcludedIngredients}>Add</button>
            </div>
            <div>
              <label>
                Excluded Ingredients
                <select
                  multiple
                  size={10}
                  style={{ width: '100%' }}
                  value={selectedExcludedIngredients}
                  onChange={(event) => setSelectedExcludedIngredients(Array.from(event.target.selectedOptions).map((option) => option.value))}
                >
                  {preferences.excludedIngredients.map((ingredient) => <option key={`excluded-${ingredient}`} value={ingredient}>{ingredient}</option>)}
                </select>
              </label>
              <button type="button" onClick={removeExcludedIngredients}>Remove</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => generatePlan()}>Generate plan</button>
            <button type="button" onClick={regeneratePlan}>Regenerate plan</button>
            <button type="button" onClick={loadMealBank}>Load meal bank</button>
            <button type="button" onClick={undoLastSwap} disabled={!undoSwapState}>Undo last swap</button>
          </div>
          <p aria-live="polite">{plannerMessage}</p>

          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
            {calibratedProfileScales.map((item) => {
              const active = item.memberId === selectedPlannerScale().memberId;
              return (
                <button
                  key={item.memberId}
                  type="button"
                  onClick={() => setSelectedPlannerMemberId(item.memberId)}
                  style={{
                    borderRadius: '999px',
                    border: active ? '1px solid #4c63d2' : '1px solid #d2d7ef',
                    background: active ? '#4c63d2' : '#eef1ff',
                    color: active ? 'white' : '#233',
                    padding: '0.35rem 0.75rem',
                    cursor: 'pointer',
                  }}
                >
                  {item.memberId}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(185px, 1fr))', gap: '0.55rem' }}>
            {weekPlan.map((day, dayIndex) => {
              const activeScale = selectedPlannerScale();
              const totals = dayTotalsForScale(day.meals, activeScale.scale);
              return (
                <div key={day.day} style={{ border: '1px solid #cfd7f3', borderRadius: '8px', padding: '0.45rem', background: 'white', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginTop: 0, textAlign: 'center' }}>{day.dayName}</h3>
                  {day.meals.map((meal, mealIndex) => (
                    <div
                      key={`${day.day}-${mealIndex}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onDrop(dayIndex, mealIndex)}
                      onClick={() => openSwapDialog(dayIndex, mealIndex, meal)}
                      style={{ border: '1px solid #d8ddf5', height: '152px', marginBottom: '0.4rem', borderRadius: '6px', padding: '0.35rem', background: '#f6f8ff', overflow: 'auto', cursor: meal ? 'pointer' : 'default' }}
                    >
                      {meal ? (
                        <div draggable onDragStart={() => onDragStart({ kind: 'slot', dayIndex, mealIndex })} style={{ cursor: 'move' }}>
                          <div style={{ fontWeight: 600 }}>{meal.recipeName}</div>
                          {(() => {
                            const macros = scaleMacros(meal.macros, activeScale.scale);
                            return (
                              <small style={{ display: 'block' }}>
                                <div>Calories: {estimateCalories(macros)} cal</div>
                                <div>Protein: {macros.proteinG}g</div>
                                <div>Fat: {macros.fatG}g</div>
                                <div>Carbs: {macros.carbG}g</div>
                              </small>
                            );
                          })()}
                        </div>
                      ) : <small style={{ color: '#7b8199' }}>Drop meal here</small>}
                    </div>
                  ))}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid #d8ddf5', paddingTop: '0.35rem' }}>
                    <small><strong>Daily total</strong></small>
                    <small style={{ display: 'block' }}>
                      <div>Calories: {totals.calories} cal</div>
                      <div>Protein: {totals.protein}g</div>
                      <div>Fat: {totals.fat}g</div>
                      <div>Carbs: {totals.carbs}g</div>
                    </small>
                  </div>
                </div>
              );
            })}
          </div>

          <h3>Meal bank (drag into planner)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))', gap: '0.55rem' }}>
            {mealSlots.map((slot) => (
              <div key={slot} style={{ border: '1px solid #ccd4f0', borderRadius: '8px', padding: '0.5rem', background: 'white' }}>
                <strong style={{ textTransform: 'capitalize' }}>{slot}</strong>
                {mealBank.filter((item) => item.mealType === slot).map((recipe) => (
                  <div key={recipe.id} draggable onDragStart={() => onDragStart({ kind: 'bank', recipe })} style={{ border: '1px solid #d8ddf5', borderRadius: '6px', marginTop: '0.35rem', padding: '0.35rem', cursor: 'grab', background: '#f6f8ff' }}>
                    <div>{recipe.name}</div>
                    <small>Protein {recipe.macros.proteinG}g • Fat {recipe.macros.fatG}g • Carbs {recipe.macros.carbG}g</small>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {swapDialog.open && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(16,20,36,0.55)', display: 'grid', placeItems: 'center', zIndex: 20 }}>
              <div style={{ width: 'min(540px, 95vw)', maxHeight: '85vh', overflow: 'auto', background: 'white', borderRadius: '10px', padding: '1rem' }}>
                <h3 style={{ marginTop: 0 }}>Swap {swapDialog.meal?.slot}</h3>
                <p>Choose a {swapDialog.meal?.slot} replacement for <strong>{swapDialog.meal?.recipeName}</strong>.</p>
                <select style={{ width: '100%' }} value={swapDialog.selectedRecipeId} onChange={(event) => setSwapDialog({ ...swapDialog, selectedRecipeId: event.target.value })}>
                  <option value="">Select a meal</option>
                  {selectableSwapRecipes.map((recipe) => <option key={`swap-${recipe.id}`} value={recipe.id}>{recipe.name}</option>)}
                </select>
                <div style={{ display: 'flex', gap: '0.45rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => applyMealSwap('single')} disabled={!swapDialog.selectedRecipeId}>Replace this day only</button>
                  <button type="button" onClick={() => applyMealSwap('all')} disabled={!swapDialog.selectedRecipeId}>Replace all occurrences</button>
                  <button type="button" onClick={() => setSwapDialog({ open: false, dayIndex: -1, mealIndex: -1, meal: null, selectedRecipeId: '' })}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'recipes' && (
        <section style={surfaceStyle}>
          <h2>Recipes used</h2>
          <p>Select one planned recipe to view quantities and instructions.</p>
          <label>
            Planned meals
            <select value={selectedRecipeId} onChange={(event) => setSelectedRecipeId(event.target.value)} style={{ marginLeft: '0.6rem' }}>
              <option value="">Select a recipe</option>
              {plannedRecipeIds.map((recipeId) => {
                const recipe = mealBank.find((item) => item.id === recipeId);
                return <option key={recipeId} value={recipeId}>{recipe?.name || recipeId}</option>;
              })}
            </select>
          </label>

          {selectedRecipe && (
            <div style={{ marginTop: '0.8rem', border: '1px solid #ccd4f0', borderRadius: '8px', background: 'white', padding: '0.8rem' }}>
              <h3 style={{ marginTop: 0 }}>{selectedRecipe.name}</h3>
              <p><strong>Base macros:</strong> {estimateCalories(selectedRecipe.macros)} cal • P {selectedRecipe.macros.proteinG}g • F {selectedRecipe.macros.fatG}g • C {selectedRecipe.macros.carbG}g</p>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Ingredient</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Base Qty</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Unit</th>
                    {calibratedProfileScales.map((profile) => (
                      <th key={profile.memberId} style={{ textAlign: 'right', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>{profile.memberId} Qty</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedRecipe.ingredients.map((ingredient) => (
                    <tr key={`${selectedRecipe.id}-${ingredient.name}`}>
                      <td style={{ borderBottom: '1px solid #eef1ff', padding: '0.35rem' }}>{ingredient.name}</td>
                      <td style={{ borderBottom: '1px solid #eef1ff', padding: '0.35rem', textAlign: 'right' }}>{ingredient.qty}</td>
                      <td style={{ borderBottom: '1px solid #eef1ff', padding: '0.35rem' }}>{ingredient.unit}</td>
                      {calibratedProfileScales.map((profile) => (
                        <td key={`${profile.memberId}-${ingredient.name}`} style={{ borderBottom: '1px solid #eef1ff', padding: '0.35rem', textAlign: 'right' }}>
                          {normalizeQtyForUnit(ingredient.qty * profile.scale, ingredient.unit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div>
                <strong>Instructions</strong>
                <ol>
                  {(selectedRecipe.instructions || ['Cook proteins and grains, combine with vegetables, and season to taste.']).map((step, index) => (
                    <li key={`${selectedRecipe.id}-step-${index}`}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>
      )}

      {activeTab === 'shopping' && (
        <section style={surfaceStyle}>
          <h2>Shopping list view</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button type="button" onClick={generateShoppingList}>Generate shopping list</button>
            <button type="button" onClick={exportShoppingList} disabled={shoppingRows.length === 0}>Export shopping list</button>
          </div>
          <p aria-live="polite">{shoppingMessage}</p>

          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Category</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Item</th>
                <th style={{ textAlign: 'right', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Quantity</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {shoppingRows.map((row) => (
                <tr key={`${row.category}-${row.name}-${row.unit}`}>
                  <td style={{ padding: '0.35rem', borderBottom: '1px solid #eef1ff', textTransform: 'capitalize' }}>{row.category}</td>
                  <td style={{ padding: '0.35rem', borderBottom: '1px solid #eef1ff' }}>{row.name}</td>
                  <td style={{ padding: '0.35rem', borderBottom: '1px solid #eef1ff', textAlign: 'right' }}>{row.qty}</td>
                  <td style={{ padding: '0.35rem', borderBottom: '1px solid #eef1ff' }}>{row.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}


      {activeTab === 'launch' && (
        <section style={surfaceStyle}>
          <h2>Internal launch checklist</h2>
          <p>Use this checklist for internal rollout readiness before Play Store internal-track submission.</p>
          <ul>
            {launchReadinessChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p style={{ marginBottom: 0 }}>
            Detailed execution ledger: <code>docs/phase-task-tracker.md</code>.
          </p>
        </section>
      )}
    </main>
  );
}
