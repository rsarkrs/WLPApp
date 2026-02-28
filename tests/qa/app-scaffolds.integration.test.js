const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');

function startProcess(command, args, readinessText, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      env: {
        ...process.env,
        ...(options.env ?? {})
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill('SIGTERM');
      reject(new Error(`Timed out waiting for readiness text "${readinessText}".\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 60000);

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!settled && stdout.includes(readinessText)) {
        settled = true;
        clearTimeout(timeout);
        resolve({ child, stdout, stderr });
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.once('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.once('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(new Error(`Process exited before readiness check with code ${code}.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    });
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(String(port)));
    });
    server.on('error', reject);
  });
}

async function stopProcess(child) {
  if (!child || child.killed) return;

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5000);

    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });

    child.kill('SIGTERM');
  });
}

async function fetchWithRetry(url, attempts = 20, delayMs = 250) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return response;
      }
      lastError = new Error(`unexpected status ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  throw lastError;
}

test('integration: api scaffold responds on /health', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const response = await fetchWithRetry(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'wlpapp-api' });
  } finally {
    await stopProcess(child);
  }
});

test('integration: liveness endpoint responds and includes request id header', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const response = await fetchWithRetry(`http://127.0.0.1:${port}/health/live`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.service, 'wlpapp-api');
    assert.ok(response.headers.get('x-request-id'));
  } finally {
    await stopProcess(child);
  }
});

test('integration: readiness endpoint returns dependency health details', async () => {
  const port = await getFreePort();
  const unreachablePort = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', {
    env: {
      PORT: port,
      POSTGRES_HOST: '127.0.0.1',
      POSTGRES_PORT: unreachablePort,
      READINESS_TIMEOUT_MS: '120',
    },
  });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health/ready`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.status, 'not_ready');
    assert.equal(body.dependencies.postgres.ready, false);
    assert.equal(body.dependencies.migrations.ready, true);
    assert.ok(body.requestId);
  } finally {
    await stopProcess(child);
  }
});

test('integration: metrics endpoint reports request counters and route stats', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    await fetchWithRetry(`http://127.0.0.1:${port}/health`);
    await fetchWithRetry(`http://127.0.0.1:${port}/health/live`);

    // Fetch twice because metrics middleware records counters on response finish,
    // so the first /metrics response may not yet include its own request.
    const firstMetricsResponse = await fetchWithRetry(`http://127.0.0.1:${port}/metrics`);
    assert.equal(firstMetricsResponse.status, 200);

    const metricsResponse = await fetchWithRetry(`http://127.0.0.1:${port}/metrics`);
    assert.equal(metricsResponse.status, 200);

    const body = await metricsResponse.json();
    assert.equal(body.service, 'wlpapp-api');
    assert.ok(body.requestsTotal >= 3);
    assert.ok(body.byPath['GET /health']);
    assert.ok(body.byPath['GET /health/live']);
    assert.ok(body.byPath['GET /metrics']);
  } finally {
    await stopProcess(child);
  }
});



test('integration: api scaffold exposes metabolic preview endpoint', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const response = await fetchWithRetry(
      `http://127.0.0.1:${port}/v1/metabolic/preview?sex=female&ageYears=30&heightCm=165&weightKg=70&activityLevel=moderate`
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.bmrKcal, 1420);
    assert.equal(body.tdeeKcal, 2201);
  } finally {
    await stopProcess(child);
  }
});

test('integration: recipe catalog endpoint supports filters', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const response = await fetchWithRetry(
      `http://127.0.0.1:${port}/v1/recipes?cuisine=american&mealType=breakfast&excludeIngredient=cheese`
    );
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.total, 1);
    assert.equal(body.items[0].id, 'r-oats-bowl');
  } finally {
    await stopProcess(child);
  }
});

test('integration: planner preview endpoint is deterministic with same seed', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const url = `http://127.0.0.1:${port}/v1/plans/preview?seed=42&mealType=breakfast&cuisine=american&sex=female&dailyCalories=1600&weightKg=70&requestedWeeklyLossKg=0.5`;
    const first = await fetchWithRetry(url);
    const second = await fetchWithRetry(url);

    const firstBody = await first.json();
    const secondBody = await second.json();

    assert.deepEqual(firstBody.plan.meals, secondBody.plan.meals);
    assert.equal(firstBody.safety.calorie.floorApplied, false);
  } finally {
    await stopProcess(child);
  }
});

test('integration: profile endpoints round-trip stored profile', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const createResponse = await fetch(`http://127.0.0.1:${port}/v1/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdId: 'hh-1',
        memberId: 'm-1',
        sex: 'female',
        ageYears: 30,
        heightCm: 165,
        weightKg: 70,
        activityLevel: 'moderate',
        targetDailyCalories: 1800,
        requestedWeeklyLossKg: 0.4,
      }),
    });

    assert.equal(createResponse.status, 200);

    const readResponse = await fetchWithRetry(`http://127.0.0.1:${port}/v1/profile?householdId=hh-1&memberId=m-1`);
    assert.equal(readResponse.status, 200);
    const profile = await readResponse.json();
    assert.equal(profile.memberId, 'm-1');
    assert.equal(profile.householdId, 'hh-1');

    const listResponse = await fetchWithRetry(`http://127.0.0.1:${port}/v1/profiles?householdId=hh-1`);
    assert.equal(listResponse.status, 200);
    const listBody = await listResponse.json();
    assert.ok(listBody.total >= 1);
  } finally {
    await stopProcess(child);
  }
});

test('integration: plans/generate honors idempotency key', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const payload = {
      idempotencyKey: 'idem-123',
      seed: 9,
      mealType: 'breakfast',
      cuisine: 'american',
      sex: 'female',
      dailyCalories: 1700,
      weightKg: 70,
      requestedWeeklyLossKg: 0.5,
    };

    const first = await fetch(`http://127.0.0.1:${port}/v1/plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(first.status, 200);
    const firstBody = await first.json();
    assert.equal(firstBody.idempotentReplay, false);

    const second = await fetch(`http://127.0.0.1:${port}/v1/plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(second.status, 200);
    const secondBody = await second.json();
    assert.equal(secondBody.idempotentReplay, true);
    assert.deepEqual(secondBody.result.plan.meals, firstBody.result.plan.meals);
  } finally {
    await stopProcess(child);
  }
});

test('integration: shopping preview consolidates and applies pantry exclusions', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const response = await fetchWithRetry(
      `http://127.0.0.1:${port}/v1/shopping/preview?seed=42&mealType=breakfast&cuisine=american&pantryExclude=milk`
    );
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.ok(body.totalItems > 0);
    assert.equal(body.items.some((item) => item.name === 'milk'), false);
  } finally {
    await stopProcess(child);
  }
});

test('integration: recipe import endpoint stores run and returns duplicate on same payload', async () => {
  const port = await getFreePort();
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Import Soup","recipeIngredient":["1 cup broth"],"recipeInstructions":["Boil."]}</script></head><body></body></html>`;

  try {
    const first = await fetch(`http://127.0.0.1:${port}/v1/imports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: 'https://example.com/soup?utm_source=x', html }),
    });
    assert.equal(first.status, 200);
    const firstBody = await first.json();
    assert.equal(firstBody.importStatus, 'imported');

    const getRun = await fetchWithRetry(`http://127.0.0.1:${port}/v1/imports/${firstBody.id}`);
    assert.equal(getRun.status, 200);

    const second = await fetch(`http://127.0.0.1:${port}/v1/imports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: 'https://example.com/soup?utm_source=y', html }),
    });
    const secondBody = await second.json();
    assert.equal(secondBody.importStatus, 'duplicate');
    assert.equal(secondBody.duplicateOf, firstBody.id);
  } finally {
    await stopProcess(child);
  }
});
test('integration: web scaffold renders Next.js landing page', async () => {
  const port = await getFreePort();
  const nextBin = path.join(process.cwd(), 'node_modules', '.bin', 'next');
  const { child } = await startProcess(nextBin, ['dev', '-p', port], 'Ready in', { cwd: path.join(process.cwd(), 'apps/web') });

  try {
    const response = await fetchWithRetry(`http://127.0.0.1:${port}`);
    const html = await response.text();
    assert.match(html, /WLPApp Web Scaffold/);
    assert.match(html, /Profile and Goals/);
    assert.match(html, /Weekly Planner/);
    assert.match(html, /Shopping List/);
    assert.match(html, /Recipes Used/);
    assert.match(html, /Load saved profiles/);
    assert.match(html, /Calculate target calories/);
    assert.match(html, /member-1/);
  } finally {
    await stopProcess(child);
  }
});
