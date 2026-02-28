const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');

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

function startApi(port) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['apps/api/server.js'], {
      env: { ...process.env, PORT: port },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Timed out waiting for API startup.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
    }, 30000);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      if (stdout.includes('WLPApp API listening')) {
        clearTimeout(timeout);
        resolve(child);
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.once('exit', (code) => {
      clearTimeout(timeout);
      if (!stdout.includes('WLPApp API listening')) {
        reject(new Error(`API exited early with code ${code}.\nstdout:\n${stdout}\nstderr:\n${stderr}`));
      }
    });
  });
}

async function stopApi(child) {
  if (!child || child.killed) return;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      resolve();
    }, 5000);

    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    child.kill('SIGTERM');
  });
}

test('integration: profile + plan generation + shopping + import run flow succeeds end-to-end', async () => {
  const port = await getFreePort();
  const child = await startApi(port);
  const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Flow Soup","recipeIngredient":["1 cup broth"],"recipeInstructions":["Boil."]}</script></head><body></body></html>`;

  try {
    const profile = await fetch(`http://127.0.0.1:${port}/v1/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        householdId: 'hh-e2e',
        memberId: 'm-e2e',
        sex: 'female',
        ageYears: 31,
        heightCm: 166,
        weightKg: 68,
        targetDailyCalories: 1650,
      }),
    });
    assert.equal(profile.status, 200);

    const generated = await fetch(`http://127.0.0.1:${port}/v1/plans/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: 'flow-1',
        seed: 11,
        mealType: 'breakfast',
        cuisine: 'american',
        sex: 'female',
        dailyCalories: 1650,
        weightKg: 68,
        requestedWeeklyLossKg: 0.3,
      }),
    });
    const generatedBody = await generated.json();
    assert.equal(generated.status, 200);
    assert.equal(generatedBody.idempotentReplay, false);
    assert.equal(generatedBody.result.plan.meals.length, 7);

    const shopping = await fetch(
      `http://127.0.0.1:${port}/v1/shopping/preview?seed=11&mealType=breakfast&cuisine=american&pantryExclude=milk`
    );
    const shoppingBody = await shopping.json();
    assert.equal(shopping.status, 200);
    assert.ok(shoppingBody.totalItems > 0);
    assert.equal(shoppingBody.items.some((item) => item.name === 'milk'), false);

    const imported = await fetch(`http://127.0.0.1:${port}/v1/imports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: 'https://example.com/flow-soup', html }),
    });
    const importedBody = await imported.json();
    assert.equal(imported.status, 200);
    assert.equal(importedBody.importStatus, 'imported');

    const importedStatus = await fetch(`http://127.0.0.1:${port}/v1/imports/${importedBody.id}`);
    assert.equal(importedStatus.status, 200);
  } finally {
    await stopApi(child);
  }
});
