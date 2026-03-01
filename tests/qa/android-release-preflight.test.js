'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

function runWithEnv(env = {}) {
  return spawnSync('node', ['scripts/check_android_release_preflight.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env
    },
    encoding: 'utf8'
  });
}

test('preflight fails when required secrets are missing', () => {
  const result = runWithEnv({
    ANDROID_KEYSTORE_BASE64: '',
    ANDROID_KEYSTORE_PASSWORD: '',
    ANDROID_KEY_ALIAS: '',
    ANDROID_KEY_PASSWORD: ''
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing required environment variable: ANDROID_KEYSTORE_BASE64/);
});

test('preflight fails when keystore payload is invalid', () => {
  const result = runWithEnv({
    ANDROID_KEYSTORE_BASE64: 'not-base64*',
    ANDROID_KEYSTORE_PASSWORD: 'pw',
    ANDROID_KEY_ALIAS: 'alias',
    ANDROID_KEY_PASSWORD: 'pw2'
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not look like a valid base64 payload/);
});

test('preflight passes with docs and non-empty base64 keystore payload', () => {
  const result = runWithEnv({
    ANDROID_KEYSTORE_BASE64: Buffer.from('dummy-keystore').toString('base64'),
    ANDROID_KEYSTORE_PASSWORD: 'pw',
    ANDROID_KEY_ALIAS: 'alias',
    ANDROID_KEY_PASSWORD: 'pw2'
  });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /android release preflight checks passed/);
});
