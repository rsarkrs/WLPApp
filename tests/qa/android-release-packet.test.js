'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { spawnSync } = require('node:child_process');

const PACKET_PATH = 'artifacts/android/release-packet.json';

function runPacketScript() {
  return spawnSync('node', ['scripts/generate_android_release_packet.js'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
}

test('android release packet script generates packet with required docs', () => {
  fs.rmSync('artifacts/android', { recursive: true, force: true });

  const result = runPacketScript();

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /android release packet generated/);
  assert.equal(fs.existsSync(PACKET_PATH), true);

  const packet = JSON.parse(fs.readFileSync(PACKET_PATH, 'utf8'));
  assert.ok(packet.generatedAt);
  assert.match(packet.sourceRevision, /^[a-f0-9]{40}$/);
  if (packet.ciRunId !== null) assert.match(String(packet.ciRunId), /^\d+$/);
  if (packet.ciRunAttempt !== null) assert.match(String(packet.ciRunAttempt), /^\d+$/);
  if (packet.ciRunNumber !== null) assert.match(String(packet.ciRunNumber), /^\d+$/);
  assert.ok(Array.isArray(packet.docs));
  assert.ok(packet.docs.length >= 6);
  assert.ok(Array.isArray(packet.checklist));
  assert.match(packet.docs[0].file, /^docs\//);
  assert.match(packet.docs[0].sha256, /^[a-f0-9]{64}$/);
});
