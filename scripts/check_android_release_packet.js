#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

const REQUIRED_DOCS = [
  'docs/mobile/android-launch-readiness.md',
  'docs/mobile/android-release-path.md',
  'docs/mobile/android-studio-testing.md',
  'docs/mobile/play-store-submission-runbook.md',
  'docs/compliance/privacy-policy.md',
  'docs/compliance/play-store-data-safety-checklist.md'
];

const packetPath = process.env.ANDROID_RELEASE_PACKET_PATH || 'artifacts/android/release-packet.json';

function fail(message) {
  console.error(`android release packet validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(packetPath)) {
  fail(`packet file missing at ${packetPath}`);
}

let packet;
try {
  packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
} catch (error) {
  fail(`packet file is not valid JSON (${error.message})`);
}

if (!packet.generatedAt || Number.isNaN(Date.parse(packet.generatedAt))) {
  fail('generatedAt must be a valid ISO timestamp');
}

if (!Array.isArray(packet.docs)) {
  fail('docs must be an array');
}

for (const requiredFile of REQUIRED_DOCS) {
  const entry = packet.docs.find((doc) => doc && doc.file === requiredFile);
  if (!entry) {
    fail(`missing docs entry for ${requiredFile}`);
  }

  if (typeof entry.bytes !== 'number' || entry.bytes <= 0) {
    fail(`invalid bytes value for ${requiredFile}`);
  }

  if (!entry.lastModified || Number.isNaN(Date.parse(entry.lastModified))) {
    fail(`invalid lastModified value for ${requiredFile}`);
  }
}

if (!Array.isArray(packet.checklist) || packet.checklist.length < 3) {
  fail('checklist must be an array with at least 3 entries');
}

console.log(`android release packet validation passed: ${packetPath}`);
