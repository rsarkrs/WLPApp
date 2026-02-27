const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

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
    }, 45000);

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

test('integration: api scaffold responds on /health', async () => {
  const port = '4100';
  const { child } = await startProcess('node', ['apps/api/server.js'], 'WLPApp API listening', { env: { PORT: port } });

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'wlpapp-api' });
  } finally {
    await stopProcess(child);
  }
});

test('integration: web scaffold renders landing page', async () => {
  const port = '3100';
  const { child } = await startProcess('node', ['apps/web/server.js'], 'WLPApp web listening', { env: { PORT: port } });

  try {
    const response = await fetch(`http://127.0.0.1:${port}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, /WLPApp Web Scaffold/);
    assert.match(html, /Phase 1 scaffold is running\./);
  } finally {
    await stopProcess(child);
  }
});
