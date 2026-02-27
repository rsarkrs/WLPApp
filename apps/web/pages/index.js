import { useMemo, useState } from 'react';

const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealSlots = ['breakfast', 'lunch', 'dinner'];

const initialForm = {
  householdId: 'hh-demo',
  memberId: 'm-demo',
  sex: 'female',
  ageYears: '30',
  heightCm: '165',
  weightKg: '70',
  targetDailyCalories: '1800',
  requestedWeeklyLossKg: '0.4',
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

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Fill in profile and goal fields, then save.');
  const [savedProfiles, setSavedProfiles] = useState([]);
  const [profilesMessage, setProfilesMessage] = useState('Load saved profiles for this household.');
  const [seed, setSeed] = useState(0);
  const [plannerMessage, setPlannerMessage] = useState('Generate a weekly plan with breakfast/lunch/dinner for each day.');
  const [weekPlan, setWeekPlan] = useState(emptyWeek());
  const [dragSource, setDragSource] = useState(null);
  const [shoppingMessage, setShoppingMessage] = useState('Generate a categorized shopping summary.');
  const [shoppingByCategory, setShoppingByCategory] = useState({});

  const apiBase = useMemo(() => '/api', []);

  async function submitProfile(event) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('Saving profile...');

    const payload = {
      householdId: form.householdId,
      memberId: form.memberId,
      sex: form.sex,
      ageYears: Number(form.ageYears),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
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

      setStatus('success');
      setMessage(`Saved profile for ${body.householdId}/${body.memberId}.`);
    } catch (error) {
      setStatus('error');
      setMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API. Start the API with `npm run start:api` and retry.' : error.message);
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
      setProfilesMessage(`Loaded ${body.total} profile(s) for household ${form.householdId}.`);
    } catch (error) {
      setProfilesMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API profiles endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  function applyProfile(profile) {
    setForm({
      householdId: profile.householdId,
      memberId: profile.memberId,
      sex: profile.sex,
      ageYears: String(profile.ageYears || ''),
      heightCm: String(profile.heightCm || ''),
      weightKg: String(profile.weightKg || ''),
      targetDailyCalories: String(profile.targetDailyCalories || ''),
      requestedWeeklyLossKg: String(profile.requestedWeeklyLossKg || ''),
    });
    setProfilesMessage(`Loaded profile ${profile.memberId} into form.`);
  }

  async function generatePlan(nextSeed = seed) {
    setPlannerMessage('Generating weekly planner preview...');

    const params = new URLSearchParams({
      seed: String(nextSeed),
      sex: form.sex,
      dailyCalories: String(Number(form.targetDailyCalories)),
      weightKg: String(Number(form.weightKg)),
      requestedWeeklyLossKg: String(Number(form.requestedWeeklyLossKg)),
    });

    try {
      const response = await fetch(`${apiBase}/v1/plans/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.code || 'Planner preview failed');
      }

      setWeekPlan(toWeekGrid(body.plan.days || []));
      setPlannerMessage(`Planner preview generated for seed ${nextSeed}. Drag meal cards to reorganize.`);
    } catch (error) {
      setPlannerMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API planner endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  async function regeneratePlan() {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    await generatePlan(nextSeed);
  }

  function onDragStart(dayIndex, slot) {
    setDragSource({ dayIndex, slot });
  }

  function onDrop(dayIndex, slot) {
    if (!dragSource) return;
    setWeekPlan((current) => swapMeals(current, dragSource, { dayIndex, slot }));
    setDragSource(null);
    setPlannerMessage('Updated plan layout with drag-and-drop swap.');
  }

  async function generateShoppingList() {
    setShoppingMessage('Generating categorized shopping summary...');

    const params = new URLSearchParams({
      seed: String(seed),
      sex: form.sex,
      dailyCalories: String(Number(form.targetDailyCalories)),
      weightKg: String(Number(form.weightKg)),
      requestedWeeklyLossKg: String(Number(form.requestedWeeklyLossKg)),
      pantryExclude: 'milk',
    });

    try {
      const response = await fetch(`${apiBase}/v1/shopping/preview?${params.toString()}`);
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.message || body.code || 'Shopping preview failed');
      }

      setShoppingByCategory(body.byCategory || {});
      setShoppingMessage(`Generated shopping list with ${body.totalItems} unique items.`);
    } catch (error) {
      setShoppingMessage(error?.message === 'Failed to fetch' ? 'Unable to reach API shopping endpoint. Start `npm run start:api` and retry.' : error.message);
    }
  }

  function exportShoppingList() {
    const data = {
      generatedAt: new Date().toISOString(),
      seed,
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

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '1rem auto', maxWidth: '1100px' }}>
      <h1>WLPApp Web Scaffold</h1>
      <p>Phase 10 MVP flows are running.</p>
      <p>API target: <code>{apiBase}</code> (proxied to API service via Next.js rewrite)</p>

      <section>
        <h2>Profile and goal setup</h2>
        <form onSubmit={submitProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '1rem' }}>
          <label>Household ID<input required value={form.householdId} onChange={(event) => setForm({ ...form, householdId: event.target.value })} /></label>
          <label>Member ID<input required value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })} /></label>
          <label>Sex<select value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}><option value="female">female</option><option value="male">male</option></select></label>
          <label>Age (years)<input type="number" min="18" value={form.ageYears} onChange={(event) => setForm({ ...form, ageYears: event.target.value })} /></label>
          <label>Height (cm)<input type="number" min="100" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} /></label>
          <label>Weight (kg)<input type="number" min="30" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} /></label>
          <label>Target daily calories<input type="number" min="1000" value={form.targetDailyCalories} onChange={(event) => setForm({ ...form, targetDailyCalories: event.target.value })} /></label>
          <label>Requested weekly loss (kg)<input type="number" min="0" step="0.1" value={form.requestedWeeklyLossKg} onChange={(event) => setForm({ ...form, requestedWeeklyLossKg: event.target.value })} /></label>
          <button type="submit" disabled={status === 'submitting'} style={{ width: 'fit-content', padding: '0.5rem 1rem' }}>{status === 'submitting' ? 'Saving...' : 'Save profile'}</button>
        </form>
        <p aria-live="polite">{message}</p>

        <div style={{ marginTop: '0.75rem' }}>
          <button type="button" onClick={loadProfiles}>Load saved profiles</button>
          <p aria-live="polite">{profilesMessage}</p>
          <ul>
            {savedProfiles.map((profile) => (
              <li key={`${profile.householdId}-${profile.memberId}`}>
                {profile.memberId} ({profile.sex}, {profile.targetDailyCalories || 'n/a'} kcal)
                <button type="button" onClick={() => applyProfile(profile)} style={{ marginLeft: '0.5rem' }}>Use profile</button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>Weekly planner view</h2>
        <p>Current seed: <strong>{seed}</strong></p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => generatePlan()} >Generate plan</button>
          <button type="button" onClick={regeneratePlan}>Regenerate plan</button>
        </div>
        <p aria-live="polite">{plannerMessage}</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))', gap: '0.75rem' }}>
          {weekPlan.map((day, dayIndex) => (
            <div key={day.day} style={{ border: '1px solid #d5d5d5', padding: '0.5rem', borderRadius: '6px' }}>
              <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{day.dayName}</h3>
              {mealSlots.map((slot) => {
                const meal = day.meals[slot];
                return (
                  <div
                    key={`${day.day}-${slot}`}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => onDrop(dayIndex, slot)}
                    style={{ border: '1px solid #bbb', minHeight: '120px', marginBottom: '0.5rem', padding: '0.4rem', background: '#fafafa' }}
                  >
                    <strong style={{ textTransform: 'capitalize' }}>{slot}</strong>
                    {meal ? (
                      <div draggable onDragStart={() => onDragStart(dayIndex, slot)} style={{ cursor: 'move', marginTop: '0.35rem', background: 'white', padding: '0.35rem' }}>
                        <div>{meal.recipeName}</div>
                        <small>Protein: {meal.macros.proteinG}g | Fat: {meal.macros.fatG}g | Carbs: {meal.macros.carbG}g</small>
                      </div>
                    ) : <div style={{ color: '#888', marginTop: '0.5rem' }}>No meal</div>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>Shopping list view</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={generateShoppingList}>Generate shopping list</button>
          <button type="button" onClick={exportShoppingList} disabled={Object.keys(shoppingByCategory).length === 0}>Export shopping list</button>
        </div>
        <p aria-live="polite">{shoppingMessage}</p>

        {Object.entries(shoppingByCategory).map(([category, items]) => (
          <div key={category} style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ textTransform: 'capitalize', marginBottom: '0.25rem' }}>{category}</h3>
            <ul>
              {items.map((item) => (
                <li key={`${category}-${item.name}-${item.unit}`}>{item.name}: {item.qty} {item.unit}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
