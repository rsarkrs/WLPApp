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

export default function HomePage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('Fill in profile and goal fields, then save.');

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

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '2rem', maxWidth: '640px' }}>
      <h1>WLPApp Web Scaffold</h1>
      <p>Phase 10 profile and goal setup flow is running.</p>
      <p>API target: <code>{apiBase}</code></p>

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
    </main>
  );
}
