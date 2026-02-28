import { useMemo, useState } from 'react';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealSlots = ['breakfast', 'lunch', 'dinner'];
const defaultActivity = 'moderate';

const initialForm = {
  householdId: 'hh-demo',
  memberId: 'member-1',
  sex: 'male',
  ageYears: '35',
  activityLevel: defaultActivity,
  unitSystem: 'imperial',
  heightCm: '185',
  weightKg: '159',
  heightFeet: '6',
  heightInches: '1',
  weightLbs: '350',
  requestedWeeklyLossKg: '0.5',
  targetDailyCalories: '2500',
};

function emptyWeek() {
  return dayNames.map((dayName, index) => ({
    day: index + 1,
    dayName,
    meals: {
      breakfast: null,
      lunch: null,
      dinner: null,
    },
  }));
}

function toWeekGrid(planDays = []) {
  return emptyWeek().map((day) => {
    const sourceDay = planDays.find((item) => item.day === day.day);
    if (!sourceDay) return day;

    const meals = { ...day.meals };
    for (const meal of sourceDay.meals || []) {
      if (meal.slot && mealSlots.includes(meal.slot)) {
        meals[meal.slot] = meal;
      }
    }

    return { ...day, meals };
  });
}

function swapMeals(week, from, to) {
  const clone = week.map((day) => ({ ...day, meals: { ...day.meals } }));
  const fromMeal = clone[from.dayIndex].meals[from.slot];
  const toMeal = clone[to.dayIndex].meals[to.slot];
  clone[from.dayIndex].meals[from.slot] = toMeal;
  clone[to.dayIndex].meals[to.slot] = fromMeal;
  return clone;
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

function imperialToMetric({ feet, inches, lbs }) {
  const totalInches = (Number(feet) * 12) + Number(inches);
  return {
    heightCm: Number((totalInches * 2.54).toFixed(1)),
    weightKg: Number((Number(lbs) * 0.45359237).toFixed(1)),
  };
}

function metricToImperial({ cm, kg }) {
  const totalInches = Number(cm) / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Number((totalInches - (feet * 12)).toFixed(1));
  return {
    feet,
    inches,
    lbs: Number((Number(kg) / 0.45359237).toFixed(1)),
  };
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState(initialForm);
  const [statusMessage, setStatusMessage] = useState('Fill in profile details and save each household member.');
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [seed, setSeed] = useState(0);
  const [plannerMessage, setPlannerMessage] = useState('Generate a 7-day planner and drag meals between slots.');
  const [weekPlan, setWeekPlan] = useState(emptyWeek());
  const [dragSource, setDragSource] = useState(null);
  const [mealBank, setMealBank] = useState({ breakfast: [], lunch: [], dinner: [] });
  const [shoppingMessage, setShoppingMessage] = useState('Generate categorized totals for unique shopping items.');
  const [shoppingByCategory, setShoppingByCategory] = useState({});

  const apiBase = useMemo(() => '/api', []);

  const householdScale = useMemo(() => {
    if (selectedMembers.length === 0) {
      return Math.max(Number(form.targetDailyCalories) || 2000, 1) / 2000;
    }

    return selectedMembers.reduce((total, memberId) => {
      const profile = savedProfiles.find((item) => item.memberId === memberId);
      const target = Number(profile?.targetDailyCalories || 2000);
      return total + (target / 2000);
    }, 0);
  }, [selectedMembers, savedProfiles, form.targetDailyCalories]);

  function updateUnitSystem(unitSystem) {
    if (unitSystem === form.unitSystem) return;

    if (unitSystem === 'metric') {
      const metric = imperialToMetric({ feet: form.heightFeet, inches: form.heightInches, lbs: form.weightLbs });
      setForm({ ...form, unitSystem, heightCm: String(metric.heightCm), weightKg: String(metric.weightKg) });
      return;
    }

    const imperial = metricToImperial({ cm: form.heightCm, kg: form.weightKg });
    setForm({ ...form, unitSystem, heightFeet: String(imperial.feet), heightInches: String(imperial.inches), weightLbs: String(imperial.lbs) });
  }

  async function calculateTargetCalories() {
    const metric = form.unitSystem === 'imperial'
      ? imperialToMetric({ feet: form.heightFeet, inches: form.heightInches, lbs: form.weightLbs })
      : { heightCm: Number(form.heightCm), weightKg: Number(form.weightKg) };

    try {
      const params = new URLSearchParams({
        sex: form.sex,
        ageYears: String(Number(form.ageYears)),
        heightCm: String(metric.heightCm),
        weightKg: String(metric.weightKg),
        activityLevel: form.activityLevel || defaultActivity,
      });
      const response = await fetch(`${apiBase}/v1/metabolic/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.code || 'Could not calculate target');
      }

      const requestedLossKg = Number(form.requestedWeeklyLossKg) || 0;
      const deficit = (requestedLossKg * 7700) / 7;
      const target = Math.max(Math.round(body.tdeeKcal - deficit), form.sex === 'male' ? 1600 : 1200);
      setForm({
        ...form,
        targetDailyCalories: String(target),
        heightCm: String(metric.heightCm),
        weightKg: String(metric.weightKg),
      });
      setStatusMessage(`Calculated target calories: ${target} kcal/day using requested weekly loss.`);
    } catch (error) {
      setStatusMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function submitProfile(event) {
    event.preventDefault();

    const metric = form.unitSystem === 'imperial'
      ? imperialToMetric({ feet: form.heightFeet, inches: form.heightInches, lbs: form.weightLbs })
      : { heightCm: Number(form.heightCm), weightKg: Number(form.weightKg) };

    const payload = {
      householdId: form.householdId,
      memberId: form.memberId,
      sex: form.sex,
      ageYears: Number(form.ageYears),
      activityLevel: form.activityLevel || defaultActivity,
      heightCm: metric.heightCm,
      weightKg: metric.weightKg,
      targetDailyCalories: Number(form.targetDailyCalories),
      requestedWeeklyLossKg: Number(form.requestedWeeklyLossKg),
    };

    try {
      const response = await fetch(`${apiBase}/v1/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || body.code || 'Profile save failed');
      }

      setStatusMessage(`Saved profile for ${body.memberId}. Add another member to plan for two people.`);
      await loadProfiles();
    } catch (error) {
      setStatusMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function loadProfiles() {
    try {
      const response = await fetch(`${apiBase}/v1/profiles?householdId=${encodeURIComponent(form.householdId)}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.code || 'Could not load profiles');
      }

      setSavedProfiles(body.items || []);
      setSelectedMembers((current) => {
        if (current.length > 0) return current;
        return (body.items || []).slice(0, 2).map((item) => item.memberId);
      });
      setStatusMessage(`Loaded ${body.total} profile(s) for household ${form.householdId}.`);
    } catch (error) {
      setStatusMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API profiles endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  function applyProfile(profile) {
    const imperial = metricToImperial({ cm: profile.heightCm, kg: profile.weightKg });
    setForm({
      ...form,
      householdId: profile.householdId,
      memberId: profile.memberId,
      sex: profile.sex,
      ageYears: String(profile.ageYears || ''),
      activityLevel: profile.activityLevel || defaultActivity,
      heightCm: String(profile.heightCm || ''),
      weightKg: String(profile.weightKg || ''),
      heightFeet: String(imperial.feet),
      heightInches: String(imperial.inches),
      weightLbs: String(imperial.lbs),
      requestedWeeklyLossKg: String(profile.requestedWeeklyLossKg || ''),
      targetDailyCalories: String(profile.targetDailyCalories || ''),
    });
    setStatusMessage(`Loaded profile ${profile.memberId} into form.`);
  }

  function toggleMember(memberId) {
    setSelectedMembers((current) => (
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId]
    ));
  }

  async function loadMealBank() {
    const response = await fetch(`${apiBase}/v1/recipes`);
    const body = await response.json();
    if (!response.ok) {
      setPlannerMessage(body.message || body.code || 'Unable to load meal bank');
      return;
    }

    const grouped = { breakfast: [], lunch: [], dinner: [] };
    for (const item of body.items || []) {
      if (grouped[item.mealType]) {
        grouped[item.mealType].push(item);
      }
    }
    setMealBank(grouped);
  }

  async function generatePlan(nextSeed = seed) {
    setPlannerMessage('Generating weekly planner preview...');

    const params = new URLSearchParams({
      seed: String(nextSeed),
      sex: form.sex,
      dailyCalories: String(Number(form.targetDailyCalories)),
      weightKg: String(Number(form.weightKg) || imperialToMetric({ feet: form.heightFeet, inches: form.heightInches, lbs: form.weightLbs }).weightKg),
      requestedWeeklyLossKg: String(Number(form.requestedWeeklyLossKg)),
    });

    try {
      const response = await fetch(`${apiBase}/v1/plans/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.code || 'Planner preview failed');
      }

      setWeekPlan(toWeekGrid(body.plan.days || []));
      setPlannerMessage(`Planner preview generated for seed ${nextSeed}. Drag cards or use meal bank to swap in meals.`);
      if (mealBank.breakfast.length === 0 && mealBank.lunch.length === 0 && mealBank.dinner.length === 0) {
        await loadMealBank();
      }
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

  function onDrop(dayIndex, slot) {
    if (!dragSource) return;

    if (dragSource.kind === 'slot') {
      setWeekPlan((current) => swapMeals(current, dragSource, { dayIndex, slot }));
      setPlannerMessage('Updated plan layout with drag-and-drop swap.');
      setDragSource(null);
      return;
    }

    if (dragSource.kind === 'bank') {
      setWeekPlan((current) => {
        const clone = current.map((day) => ({ ...day, meals: { ...day.meals } }));
        clone[dayIndex].meals[slot] = {
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

  async function generateShoppingList() {
    setShoppingMessage('Generating categorized shopping summary...');

    const params = new URLSearchParams({
      seed: String(seed),
      sex: form.sex,
      dailyCalories: String(Number(form.targetDailyCalories)),
      weightKg: String(Number(form.weightKg) || imperialToMetric({ feet: form.heightFeet, inches: form.heightInches, lbs: form.weightLbs }).weightKg),
      requestedWeeklyLossKg: String(Number(form.requestedWeeklyLossKg)),
      pantryExclude: 'milk',
    });

    try {
      const response = await fetch(`${apiBase}/v1/shopping/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.code || 'Shopping preview failed');
      }

      const scaledByCategory = Object.fromEntries(
        Object.entries(body.byCategory || {}).map(([category, items]) => [
          category,
          items.map((item) => ({ ...item, qty: Number((item.qty * householdScale).toFixed(2)) })),
        ])
      );

      setShoppingByCategory(scaledByCategory);
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
      byCategory: shoppingByCategory,
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
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '1rem auto', maxWidth: '1280px', color: '#1f2438' }}>
      <h1>WLPApp Web Scaffold</h1>
      <p>Phase 10 MVP flows are running.</p>
      <p>API target: <code>/api</code> (proxied to API service via Next.js rewrite)</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {tabButton('profile', 'Profile and Goals')}
        {tabButton('planner', 'Weekly Planner')}
        {tabButton('shopping', 'Shopping List')}
      </div>

      {activeTab === 'profile' && (
        <section style={surfaceStyle}>
          <h2>Profile and goal setup</h2>
          <form onSubmit={submitProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <label>Household ID<input required style={{ width: '100%' }} value={form.householdId} onChange={(event) => setForm({ ...form, householdId: event.target.value })} /></label>
            <label>Member ID<input required style={{ width: '100%' }} value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })} /></label>
            <label>Sex<select style={{ width: '100%' }} value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}><option value="female">female</option><option value="male">male</option></select></label>
            <label>Age (years)<input style={{ width: '100%' }} type="number" min="18" value={form.ageYears} onChange={(event) => setForm({ ...form, ageYears: event.target.value })} /></label>
            <label>Activity<select style={{ width: '100%' }} value={form.activityLevel} onChange={(event) => setForm({ ...form, activityLevel: event.target.value })}><option value="sedentary">sedentary</option><option value="light">light</option><option value="moderate">moderate</option><option value="active">active</option><option value="very_active">very_active</option></select></label>
            <label>Units<select style={{ width: '100%' }} value={form.unitSystem} onChange={(event) => updateUnitSystem(event.target.value)}><option value="imperial">imperial (ft/in, lbs)</option><option value="metric">metric (cm, kg)</option></select></label>

            {form.unitSystem === 'imperial' ? (
              <>
                <label>Height (ft)<input style={{ width: '100%' }} type="number" min="1" value={form.heightFeet} onChange={(event) => setForm({ ...form, heightFeet: event.target.value })} /></label>
                <label>Height (in)<input style={{ width: '100%' }} type="number" min="0" value={form.heightInches} onChange={(event) => setForm({ ...form, heightInches: event.target.value })} /></label>
                <label>Weight (lbs)<input style={{ width: '100%' }} type="number" min="50" value={form.weightLbs} onChange={(event) => setForm({ ...form, weightLbs: event.target.value })} /></label>
              </>
            ) : (
              <>
                <label>Height (cm)<input style={{ width: '100%' }} type="number" min="100" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} /></label>
                <label>Weight (kg)<input style={{ width: '100%' }} type="number" min="30" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} /></label>
                <label style={{ visibility: 'hidden' }}>placeholder<input disabled style={{ width: '100%' }} /></label>
              </>
            )}

            <label>Requested weekly loss (kg)<input style={{ width: '100%' }} type="number" min="0" step="0.1" value={form.requestedWeeklyLossKg} onChange={(event) => setForm({ ...form, requestedWeeklyLossKg: event.target.value })} /></label>
            <label>Target daily calories (calculated)<input style={{ width: '100%' }} type="number" min="1000" value={form.targetDailyCalories} readOnly /></label>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              <button type="button" onClick={calculateTargetCalories}>Calculate target calories</button>
              <button type="submit">Save profile</button>
              <button type="button" onClick={loadProfiles}>Load saved profiles</button>
            </div>
          </form>

          <p aria-live="polite">{statusMessage}</p>

          <h3>Household members for plan scaling</h3>
          <ul>
            {savedProfiles.map((profile) => (
              <li key={`${profile.householdId}-${profile.memberId}`}>
                <label>
                  <input type="checkbox" checked={selectedMembers.includes(profile.memberId)} onChange={() => toggleMember(profile.memberId)} />
                  {profile.memberId} — {profile.targetDailyCalories || 'n/a'} kcal/day
                </label>
                <button type="button" onClick={() => applyProfile(profile)} style={{ marginLeft: '0.5rem' }}>Use profile</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {activeTab === 'planner' && (
        <section style={surfaceStyle}>
          <h2>Weekly planner view</h2>
          <p>Current seed: <strong>{seed}</strong></p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => generatePlan()}>Generate plan</button>
            <button type="button" onClick={regeneratePlan}>Regenerate plan</button>
            <button type="button" onClick={loadMealBank}>Load meal bank</button>
          </div>
          <p aria-live="polite">{plannerMessage}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(160px, 1fr))', gap: '0.65rem' }}>
            {weekPlan.map((day, dayIndex) => (
              <div key={day.day} style={{ border: '1px solid #ccd4f0', borderRadius: '8px', padding: '0.45rem', background: '#fff' }}>
                <h3 style={{ marginTop: 0, textAlign: 'center' }}>{day.dayName}</h3>
                {mealSlots.map((slot) => {
                  const meal = day.meals[slot];
                  const cardMacros = meal ? scaleMacros(meal.macros, householdScale) : null;
                  const calories = meal ? estimateCalories(cardMacros) : null;
                  return (
                    <div
                      key={`${day.day}-${slot}`}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => onDrop(dayIndex, slot)}
                      style={{ border: '1px solid #d8ddf5', minHeight: '112px', marginBottom: '0.45rem', padding: '0.4rem', borderRadius: '6px', background: '#f6f8ff' }}
                    >
                      {meal ? (
                        <div draggable onDragStart={() => onDragStart({ kind: 'slot', dayIndex, slot })} style={{ cursor: 'move' }}>
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
              </div>
            ))}
          </div>

          <h3>Meal bank (drag into planner)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: '0.5rem' }}>
            {mealSlots.map((slot) => (
              <div key={slot} style={{ border: '1px solid #ccd4f0', borderRadius: '8px', padding: '0.5rem', background: '#fff' }}>
                <strong style={{ textTransform: 'capitalize' }}>{slot}</strong>
                {mealBank[slot].map((recipe) => (
                  <div
                    key={recipe.id}
                    draggable
                    onDragStart={() => onDragStart({ kind: 'bank', recipe })}
                    style={{ border: '1px solid #d8ddf5', borderRadius: '6px', marginTop: '0.35rem', padding: '0.35rem', cursor: 'grab', background: '#f6f8ff' }}
                  >
                    <div>{recipe.name}</div>
                    <small>Protein {recipe.macros.proteinG}g • Fat {recipe.macros.fatG}g • Carbs {recipe.macros.carbG}g</small>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'shopping' && (
        <section style={surfaceStyle}>
          <h2>Shopping list view</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={generateShoppingList}>Generate shopping list</button>
            <button type="button" onClick={exportShoppingList} disabled={Object.keys(shoppingByCategory).length === 0}>Export shopping list</button>
          </div>
          <p aria-live="polite">{shoppingMessage}</p>

          {Object.entries(shoppingByCategory).map(([category, items]) => (
            <div key={category} style={{ marginBottom: '1rem' }}>
              <h3 style={{ textTransform: 'capitalize' }}>{category}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Item</th>
                    <th style={{ textAlign: 'right', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Quantity</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccd4f0', padding: '0.35rem' }}>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${category}-${item.name}-${item.unit}`}>
                      <td style={{ padding: '0.35rem', borderBottom: '1px solid #eef1ff' }}>{item.name}</td>
                      <td style={{ padding: '0.35rem', textAlign: 'right', borderBottom: '1px solid #eef1ff' }}>{item.qty}</td>
                      <td style={{ padding: '0.35rem', borderBottom: '1px solid #eef1ff' }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
