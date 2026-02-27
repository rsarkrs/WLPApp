import { useMemo, useState } from 'react';

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

function groupShoppingItems(items) {
  return items.reduce((groups, item) => {
    const key = item.unit || 'other';
    const current = groups[key] || [];
    return { ...groups, [key]: [...current, item] };
  }, {});
}

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Fill in profile and goal fields, then save.');
  const [seed, setSeed] = useState(0);
  const [planStatus, setPlanStatus] = useState('idle');
  const [plannerMessage, setPlannerMessage] = useState('Generate a weekly plan preview to review and swap meals.');
  const [planMeals, setPlanMeals] = useState([]);
  const [shoppingStatus, setShoppingStatus] = useState('idle');
  const [shoppingMessage, setShoppingMessage] = useState('Generate a grouped shopping list for the current seed.');
  const [shoppingGroups, setShoppingGroups] = useState({});

  const apiBase = useMemo(() => {
    const configuredBase = process.env.NEXT_PUBLIC_API_BASE;
    if (configuredBase) {
      return configuredBase.replace(/\/$/, '');
    }
    return 'http://localhost:4000';
  }, []);

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
      setMessage(error.message);
    }
  }

  async function generatePlan(nextSeed = seed) {
    setPlanStatus('loading');
    setPlannerMessage('Generating weekly planner preview...');

    const params = new URLSearchParams({
      seed: String(nextSeed),
      mealType: 'breakfast',
      cuisine: 'american',
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

      setPlanMeals(body.plan.meals || []);
      setPlanStatus('success');
      setPlannerMessage(`Planner preview generated for seed ${nextSeed}.`);
    } catch (error) {
      setPlanStatus('error');
      setPlannerMessage(error.message);
    }
  }

  async function regeneratePlan() {
    const nextSeed = seed + 1;
    setSeed(nextSeed);
    await generatePlan(nextSeed);
  }

  function swapFirstTwoMeals() {
    if (planMeals.length < 2) {
      setPlannerMessage('Need at least two meals in the plan to swap.');
      return;
    }

    const swapped = [...planMeals];
    const first = swapped[0];
    swapped[0] = swapped[1];
    swapped[1] = first;
    setPlanMeals(swapped);
    setPlannerMessage('Swapped day 1 and day 2 meals locally for review.');
  }

  async function generateShoppingList() {
    setShoppingStatus('loading');
    setShoppingMessage('Generating grouped shopping list...');

    const params = new URLSearchParams({
      seed: String(seed),
      mealType: 'breakfast',
      cuisine: 'american',
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

      const grouped = groupShoppingItems(body.items || []);
      setShoppingGroups(grouped);
      setShoppingStatus('success');
      setShoppingMessage(`Generated shopping list with ${body.totalItems} items.`);
    } catch (error) {
      setShoppingStatus('error');
      setShoppingMessage(error.message);
    }
  }

  function exportShoppingList() {
    const data = {
      generatedAt: new Date().toISOString(),
      seed,
      groups: shoppingGroups,
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
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem', maxWidth: '760px' }}>
      <h1>WLPApp Web Scaffold</h1>
      <p>Phase 10 MVP flows are running.</p>
      <p>API target: <code>{apiBase}</code></p>

      <section>
        <h2>Profile and goal setup</h2>
        <form onSubmit={submitProfile} style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
          <label>
            Household ID
            <input required value={form.householdId} onChange={(event) => setForm({ ...form, householdId: event.target.value })} />
          </label>
          <label>
            Member ID
            <input required value={form.memberId} onChange={(event) => setForm({ ...form, memberId: event.target.value })} />
          </label>
          <label>
            Sex
            <select value={form.sex} onChange={(event) => setForm({ ...form, sex: event.target.value })}>
              <option value="female">female</option>
              <option value="male">male</option>
            </select>
          </label>
          <label>
            Age (years)
            <input type="number" min="18" value={form.ageYears} onChange={(event) => setForm({ ...form, ageYears: event.target.value })} />
          </label>
          <label>
            Height (cm)
            <input type="number" min="100" value={form.heightCm} onChange={(event) => setForm({ ...form, heightCm: event.target.value })} />
          </label>
          <label>
            Weight (kg)
            <input type="number" min="30" value={form.weightKg} onChange={(event) => setForm({ ...form, weightKg: event.target.value })} />
          </label>
          <label>
            Target daily calories
            <input type="number" min="1000" value={form.targetDailyCalories} onChange={(event) => setForm({ ...form, targetDailyCalories: event.target.value })} />
          </label>
          <label>
            Requested weekly loss (kg)
            <input type="number" min="0" step="0.1" value={form.requestedWeeklyLossKg} onChange={(event) => setForm({ ...form, requestedWeeklyLossKg: event.target.value })} />
          </label>

          <button type="submit" disabled={status === 'submitting'} style={{ width: 'fit-content', padding: '0.5rem 1rem' }}>
            {status === 'submitting' ? 'Saving...' : 'Save profile'}
          </button>
        </form>

        <p aria-live="polite" style={{ marginTop: '1rem' }}>{message}</p>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>Weekly planner view</h2>
        <p>Current seed: <strong>{seed}</strong></p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => generatePlan()} disabled={planStatus === 'loading'}>Generate plan</button>
          <button type="button" onClick={regeneratePlan} disabled={planStatus === 'loading'}>Regenerate plan</button>
          <button type="button" onClick={swapFirstTwoMeals}>Swap day 1/day 2</button>
        </div>
        <p aria-live="polite">{plannerMessage}</p>
        <ul>
          {planMeals.map((meal) => (
            <li key={`${meal.day}-${meal.recipeId}`}>Day {meal.day}: {meal.recipeName}</li>
          ))}
        </ul>
      </section>

      <hr style={{ margin: '1.5rem 0' }} />

      <section>
        <h2>Shopping list grouped view</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={generateShoppingList} disabled={shoppingStatus === 'loading'}>Generate shopping list</button>
          <button type="button" onClick={exportShoppingList} disabled={Object.keys(shoppingGroups).length === 0}>Export shopping list</button>
        </div>
        <p aria-live="polite">{shoppingMessage}</p>

        {Object.entries(shoppingGroups).map(([unit, items]) => (
          <div key={unit}>
            <h3>Group: {unit}</h3>
            <ul>
              {items.map((item) => (
                <li key={`${unit}-${item.name}`}>{item.name}: {item.qty} {item.unit}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}
