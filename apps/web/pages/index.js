import { useMemo, useState } from 'react';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultActivity = 'moderate';

function makeProfile(memberId) {
  return {
    householdId: 'hh-demo',
    memberId,
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
  const [profiles, setProfiles] = useState([makeProfile('member-1'), makeProfile('member-2')]);
  const [statusMessage, setStatusMessage] = useState('Save profiles for two household members in MVP mode.');
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [seed, setSeed] = useState(0);
  const [plannerMessage, setPlannerMessage] = useState('Generate a weekly planner and drag/drop cards to reorganize.');
  const [weekPlan, setWeekPlan] = useState(emptyWeek());
  const [dragSource, setDragSource] = useState(null);
  const [mealBank, setMealBank] = useState([]);
  const [shoppingMessage, setShoppingMessage] = useState('Generate categorized totals for unique shopping items.');
  const [shoppingRows, setShoppingRows] = useState([]);
  const [preferences, setPreferences] = useState({
    cuisine: '',
    includeIngredient: '',
    excludeIngredient: '',
  });

  const apiBase = useMemo(() => '/api', []);

  const householdScale = useMemo(() => {
    if (selectedMembers.length === 0) {
      const primary = Number(profiles[0].targetDailyCalories || 2000);
      return primary / 2000;
    }

    return selectedMembers.reduce((total, memberId) => {
      const profile = savedProfiles.find((item) => item.memberId === memberId);
      const target = Number(profile?.targetDailyCalories || 2000);
      return total + (target / 2000);
    }, 0);
  }, [profiles, selectedMembers, savedProfiles]);

  const recipeDetailsRows = useMemo(
    () => weekPlan.flatMap((day) => day.meals.filter(Boolean).map((meal) => mapMealToDetail(meal, day.dayName))),
    [weekPlan, mealBank]
  );

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
      sex: profile.sex,
      ageYears: Number(profile.ageYears),
      activityLevel: profile.activityLevel,
      heightCm: metric.heightCm,
      weightKg: metric.weightKg,
      targetDailyCalories: Number(profile.targetDailyCalories),
      requestedWeeklyLossKg: metric.requestedWeeklyLossKg,
    };

    try {
      const response = await fetch(`${apiBase}/v1/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Profile save failed');

      setStatusMessage(`Saved ${body.memberId}.`);
      await loadProfiles(body.householdId);
    } catch (error) {
      setStatusMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function loadProfiles(householdId = profiles[0].householdId) {
    try {
      const response = await fetch(`${apiBase}/v1/profiles?householdId=${encodeURIComponent(householdId)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Could not load profiles');

      setSavedProfiles(body.items || []);
      setSelectedMembers((body.items || []).slice(0, 2).map((item) => item.memberId));
      setStatusMessage(`Loaded ${body.total} profile(s) for household ${householdId}.`);
    } catch (error) {
      setStatusMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API profiles endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function loadMealBank() {
    const query = new URLSearchParams();
    if (preferences.cuisine) query.set('cuisine', preferences.cuisine);
    if (preferences.includeIngredient) query.set('includeIngredient', preferences.includeIngredient);
    if (preferences.excludeIngredient) query.set('excludeIngredient', preferences.excludeIngredient);

    const response = await fetch(`${apiBase}/v1/recipes?${query.toString()}`);
    const body = await response.json();
    if (!response.ok) {
      setPlannerMessage(body.message || body.code || 'Unable to load meal bank');
      return;
    }
    setMealBank(body.items || []);
  }

  function mapMealToDetail(meal, dayName) {
    const recipe = mealBank.find((item) => item.id === meal.recipeId);
    return {
      dayName,
      recipeName: meal.recipeName,
      slot: meal.slot,
      macros: meal.macros,
      ingredients: recipe?.ingredients || [],
    };
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

    if (preferences.cuisine) params.set('cuisine', preferences.cuisine);
    if (preferences.includeIngredient) params.set('includeIngredient', preferences.includeIngredient);
    if (preferences.excludeIngredient) params.set('excludeIngredient', preferences.excludeIngredient);

    try {
      const response = await fetch(`${apiBase}/v1/plans/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Planner preview failed');

      const week = toWeekGrid(body.plan.days || []);
      setWeekPlan(week);
      setPlannerMessage(`Planner generated with preferences. Drag cards or meal-bank items to reorganize.`);
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
        const slot = mealIndex === 0 ? 'breakfast' : mealIndex === 1 ? 'lunch' : 'dinner';
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

  function dayTotals(meals) {
    return meals.filter(Boolean).reduce((acc, meal) => {
      const scaled = scaleMacros(meal.macros, householdScale);
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

    if (preferences.cuisine) params.set('cuisine', preferences.cuisine);
    if (preferences.includeIngredient) params.set('includeIngredient', preferences.includeIngredient);
    if (preferences.excludeIngredient) params.set('excludeIngredient', preferences.excludeIngredient);

    try {
      const response = await fetch(`${apiBase}/v1/shopping/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || body.code || 'Shopping preview failed');

      const rows = [];
      for (const [category, items] of Object.entries(body.byCategory || {})) {
        for (const item of items) {
          rows.push({
            category,
            name: item.name,
            qty: Number((item.qty * householdScale).toFixed(2)),
            unit: item.unit,
          });
        }
      }

      setShoppingRows(rows.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
      setShoppingMessage(`Generated shopping totals for ${selectedMembers.length || 1} household member(s).`);
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
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '1rem auto', maxWidth: '1400px', color: '#1f2438' }}>
      <h1>WLPApp Web Scaffold</h1>
      <p>Phase 10 MVP flows are running.</p>
      <p>API target: <code>/api</code> (proxied to API service via Next.js rewrite)</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {tabButton('profile', 'Profile and Goals')}
        {tabButton('planner', 'Weekly Planner')}
        {tabButton('recipes', 'Recipes Used')}
        {tabButton('shopping', 'Shopping List')}
      </div>

      {activeTab === 'profile' && (
        <section style={surfaceStyle}>
          <h2>Profile and goal setup (2-member MVP)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(420px, 1fr))', gap: '1rem' }}>
            {profiles.map((profile, index) => (
              <div key={profile.memberId} style={{ border: '1px solid #ccd4f0', borderRadius: '8px', padding: '0.75rem', background: 'white' }}>
                <h3 style={{ marginTop: 0 }}>Member {index + 1} profile</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '0.6rem' }}>
                  <label>Household ID<input style={{ width: '100%' }} value={profile.householdId} onChange={(e) => updateProfile(index, { householdId: e.target.value })} /></label>
                  <label>Member ID<input style={{ width: '100%' }} value={profile.memberId} onChange={(e) => updateProfile(index, { memberId: e.target.value })} /></label>
                  <label>Sex<select style={{ width: '100%' }} value={profile.sex} onChange={(e) => updateProfile(index, { sex: e.target.value })}><option value="female">female</option><option value="male">male</option></select></label>
                  <label>Age<input style={{ width: '100%' }} type="number" min="18" value={profile.ageYears} onChange={(e) => updateProfile(index, { ageYears: e.target.value })} /></label>
                  <label>Activity<select style={{ width: '100%' }} value={profile.activityLevel} onChange={(e) => updateProfile(index, { activityLevel: e.target.value })}><option value="sedentary">sedentary</option><option value="light">light</option><option value="moderate">moderate</option><option value="active">active</option><option value="very_active">very_active</option></select></label>
                  <label>Units<select style={{ width: '100%' }} value={profile.unitSystem} onChange={(e) => updateProfileUnit(index, e.target.value)}><option value="imperial">imperial</option><option value="metric">metric</option></select></label>
                  <label>Weight ({profile.unitSystem === 'imperial' ? 'lbs' : 'kg'})<input style={{ width: '100%' }} type="number" value={profile.weight} onChange={(e) => updateProfile(index, { weight: e.target.value })} /></label>
                  <label>Height ({profile.unitSystem === 'imperial' ? 'ft' : 'cm'})<input style={{ width: '100%' }} type="number" value={profile.heightPrimary} onChange={(e) => updateProfile(index, { heightPrimary: e.target.value })} /></label>
                  <label>Height ({profile.unitSystem === 'imperial' ? 'in' : 'secondary'})<input style={{ width: '100%' }} type="number" value={profile.heightSecondary} disabled={profile.unitSystem !== 'imperial'} onChange={(e) => updateProfile(index, { heightSecondary: e.target.value })} /></label>
                  <label>Requested weekly loss ({profile.unitSystem === 'imperial' ? 'lbs' : 'kg'})<input style={{ width: '100%' }} type="number" step="0.1" value={profile.requestedWeeklyLoss} onChange={(e) => updateProfile(index, { requestedWeeklyLoss: e.target.value })} /></label>
                  <label>Target calories<input style={{ width: '100%' }} type="number" value={profile.targetDailyCalories} readOnly /></label>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.7rem' }}>
                  <button type="button" onClick={() => calculateTargetCalories(index)}>Calculate target calories</button>
                  <button type="button" onClick={() => saveProfile(index)}>Save member</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <button type="button" onClick={() => loadProfiles()}>Load saved profiles</button>
            <p aria-live="polite">{statusMessage}</p>
            <p><strong>Members used for planner scaling (select up to two):</strong></p>
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
                        return next.slice(0, 2);
                      })}
                    />
                    {item.memberId} ({item.targetDailyCalories} kcal)
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(200px, 1fr))', gap: '0.6rem', marginBottom: '0.7rem' }}>
            <label>Preferred cuisines (comma list)<input style={{ width: '100%' }} value={preferences.cuisine} onChange={(e) => setPreferences({ ...preferences, cuisine: e.target.value })} placeholder="asian,mediterranean" /></label>
            <label>Include ingredients<input style={{ width: '100%' }} value={preferences.includeIngredient} onChange={(e) => setPreferences({ ...preferences, includeIngredient: e.target.value })} placeholder="rice,ginger" /></label>
            <label>Exclude ingredients<input style={{ width: '100%' }} value={preferences.excludeIngredient} onChange={(e) => setPreferences({ ...preferences, excludeIngredient: e.target.value })} placeholder="cheese" /></label>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
            <button type="button" onClick={() => generatePlan()}>Generate plan</button>
            <button type="button" onClick={regeneratePlan}>Regenerate plan</button>
            <button type="button" onClick={loadMealBank}>Load meal bank</button>
          </div>
          <p aria-live="polite">{plannerMessage}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(170px, 1fr))', gap: '0.55rem' }}>
            {weekPlan.map((day, dayIndex) => {
              const totals = dayTotals(day.meals);
              return (
                <div key={day.day} style={{ border: '1px solid #cfd7f3', borderRadius: '8px', padding: '0.45rem', background: 'white', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginTop: 0, textAlign: 'center' }}>{day.dayName}</h3>
                  {day.meals.map((meal, mealIndex) => {
                    const cardMacros = meal ? scaleMacros(meal.macros, householdScale) : null;
                    const calories = meal ? estimateCalories(cardMacros) : null;
                    return (
                      <div
                        key={`${day.day}-${mealIndex}`}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => onDrop(dayIndex, mealIndex)}
                        style={{ border: '1px solid #d8ddf5', minHeight: '116px', marginBottom: '0.4rem', borderRadius: '6px', padding: '0.35rem', background: '#f6f8ff' }}
                      >
                        {meal ? (
                          <div draggable onDragStart={() => onDragStart({ kind: 'slot', dayIndex, mealIndex })} style={{ cursor: 'move' }}>
                            <div style={{ fontWeight: 600 }}>{meal.recipeName}</div>
                            <small>Cal: {calories}</small><br />
                            <small>Protein: {cardMacros.proteinG}g</small><br />
                            <small>Fat: {cardMacros.fatG}g</small><br />
                            <small>Carbs: {cardMacros.carbG}g</small>
                          </div>
                        ) : <small style={{ color: '#7b8199' }}>Drop meal here</small>}
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 'auto', borderTop: '1px solid #d8ddf5', paddingTop: '0.35rem' }}>
                    <small><strong>Daily total</strong></small><br />
                    <small>Cal: {totals.calories}</small><br />
                    <small>Protein: {totals.protein}g</small><br />
                    <small>Fat: {totals.fat}g</small><br />
                    <small>Carbs: {totals.carbs}g</small>
                  </div>
                </div>
              );
            })}
          </div>

          <h3>Meal bank (drag into planner)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(240px, 1fr))', gap: '0.55rem' }}>
            {['breakfast', 'lunch', 'dinner'].map((slot) => (
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
        </section>
      )}

      {activeTab === 'recipes' && (
        <section style={surfaceStyle}>
          <h2>Recipes chosen for the planner</h2>
          <p>This tab lists the selected meals and their ingredient details.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(360px, 1fr))', gap: '0.7rem' }}>
            {recipeDetailsRows.map((row, index) => (
              <div key={`${row.dayName}-${row.recipeName}-${index}`} style={{ border: '1px solid #ccd4f0', borderRadius: '8px', padding: '0.6rem', background: 'white' }}>
                <div><strong>{row.dayName}</strong> • {row.slot}</div>
                <div style={{ fontWeight: 600 }}>{row.recipeName}</div>
                <small>Protein {row.macros.proteinG}g • Fat {row.macros.fatG}g • Carbs {row.macros.carbG}g</small>
                <ul style={{ marginBottom: 0 }}>
                  {row.ingredients.map((ingredient) => (
                    <li key={`${row.recipeName}-${ingredient.name}`}>{ingredient.name}: {ingredient.qty} {ingredient.unit}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
    </main>
  );
}
