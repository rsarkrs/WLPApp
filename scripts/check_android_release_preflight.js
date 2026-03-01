#!/usr/bin/env node
'use strict';

const REQUIRED_DOCS = [
  'docs/mobile/android-launch-readiness.md',
  'docs/mobile/android-release-path.md',
  'docs/mobile/play-store-submission-runbook.md',
  'docs/mobile/android-studio-testing.md'
];

const REQUIRED_SECRETS = [
  'ANDROID_KEYSTORE_BASE64',
  'ANDROID_KEYSTORE_PASSWORD',
  'ANDROID_KEY_ALIAS',
  'ANDROID_KEY_PASSWORD'
];

const fs = require('node:fs');

function fail(message) {
  console.error(`android release preflight failed: ${message}`);
  process.exit(1);
}

for (const file of REQUIRED_DOCS) {
  if (!fs.existsSync(file)) {
    fail(`missing required documentation file: ${file}`);
  }
}

for (const key of REQUIRED_SECRETS) {
  if (!process.env[key] || process.env[key].trim().length === 0) {
    fail(`missing required environment variable: ${key}`);
  }
}

const keystoreRaw = process.env.ANDROID_KEYSTORE_BASE64;
let decoded;
try {
  decoded = Buffer.from(keystoreRaw, 'base64');
} catch (error) {
  fail(`ANDROID_KEYSTORE_BASE64 is not valid base64 (${error.message})`);
}

if (!decoded || decoded.length === 0) {
  fail('ANDROID_KEYSTORE_BASE64 decoded to an empty value');
}

if (keystoreRaw.length % 4 !== 0 || !/^[A-Za-z0-9+/=\r\n]+$/.test(keystoreRaw)) {
  fail('ANDROID_KEYSTORE_BASE64 does not look like a valid base64 payload');
}

console.log('android release preflight checks passed.');
