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
test('integration: web scaffold renders Next.js landing page', async () => {
  const port = await getFreePort();
  const nextBin = path.join(process.cwd(), 'node_modules', '.bin', 'next');
  const { child } = await startProcess(nextBin, ['dev', '-p', port], 'Ready in', { cwd: path.join(process.cwd(), 'apps/web') });

  try {
    const response = await fetchWithRetry(`http://127.0.0.1:${port}`);
    const html = await response.text();
    assert.match(html, /WLPApp Web Scaffold/);
    assert.match(html, /Phase 1 Next\.js scaffold is running\./);
  } finally {
    await stopProcess(child);
  }
});
