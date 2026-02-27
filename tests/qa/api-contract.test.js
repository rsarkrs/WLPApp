const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const net = require('node:net');

const {
  validateProfileResponse,
  validatePlanPreviewResponse,
  validateShoppingPreviewResponse,
  validateImportRunResponse,
  validateErrorResponse,
} = require('../../src/contracts/api');

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

test('contract: profile, plan, shopping, and import payloads match shared API contract validators', async () => {
  const port = await getFreePort();
  const child = await startApi(port);
  const html = `<html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Parity Soup","recipeIngredient":["1 cup broth"],"recipeInstructions":["Boil."]}</script></head><body></body></html>`;

  try {
    const profileResponse = await fetch(`http://127.0.0.1:${port}/v1/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ householdId: 'hh-contract', memberId: 'm-contract', sex: 'female' }),
    });
    const profileBody = await profileResponse.json();
    assert.equal(profileResponse.status, 200);
    assert.equal(validateProfileResponse(profileBody), true);

    const planResponse = await fetch(
      `http://127.0.0.1:${port}/v1/plans/preview?seed=99&mealType=breakfast&cuisine=american&sex=female&dailyCalories=1600&weightKg=70&requestedWeeklyLossKg=0.4`
    );
    const planBody = await planResponse.json();
    assert.equal(planResponse.status, 200);
    assert.equal(validatePlanPreviewResponse(planBody), true);

    const shoppingResponse = await fetch(
      `http://127.0.0.1:${port}/v1/shopping/preview?seed=99&mealType=breakfast&cuisine=american&pantryExclude=milk`
    );
    const shoppingBody = await shoppingResponse.json();
    assert.equal(shoppingResponse.status, 200);
    assert.equal(validateShoppingPreviewResponse(shoppingBody), true);

    const importResponse = await fetch(`http://127.0.0.1:${port}/v1/imports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceUrl: 'https://example.com/parity-soup', html }),
    });
    const importBody = await importResponse.json();
    assert.equal(importResponse.status, 200);
    assert.equal(validateImportRunResponse(importBody), true);

    const errorResponse = await fetch(`http://127.0.0.1:${port}/v1/profile?householdId=missing&memberId=missing`);
    const errorBody = await errorResponse.json();
    assert.equal(errorResponse.status, 404);
    assert.equal(validateErrorResponse(errorBody), true);
  } finally {
    await stopApi(child);
  }
});
