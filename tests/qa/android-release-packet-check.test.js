'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function run(command, args, env = {}) {
  return spawnSync(command, args, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env
    },
    encoding: 'utf8'
  });
}

test('release packet checker passes on generated packet', () => {
  fs.rmSync('artifacts/android', { recursive: true, force: true });

  const gen = run('node', ['scripts/generate_android_release_packet.js']);
  assert.equal(gen.status, 0, gen.stderr);

  const check = run('node', ['scripts/check_android_release_packet.js']);
  assert.equal(check.status, 0, check.stderr);
  assert.match(check.stdout, /android release packet validation passed/);
});

test('release packet checker fails when required docs entry is missing', () => {
  const badPacketPath = path.join('.tmp', 'bad-release-packet.json');
  fs.mkdirSync('.tmp', { recursive: true });

  fs.writeFileSync(
    badPacketPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        docs: [
          {
            file: 'docs/mobile/android-launch-readiness.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: crypto.createHash('sha256').update(fs.readFileSync('docs/mobile/android-launch-readiness.md')).digest('hex')
          }
        ],
        checklist: ['a', 'b', 'c']
      },
      null,
      2
    )
  );

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_PACKET_PATH: badPacketPath
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /missing docs entry/);
});


test('release packet checker fails when hash does not match source file', () => {
  const badHashPath = path.join('.tmp', 'bad-release-packet-hash.json');
  fs.mkdirSync('.tmp', { recursive: true });

  fs.writeFileSync(
    badHashPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        docs: [
          {
            file: 'docs/mobile/android-launch-readiness.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: '0'.repeat(64)
          },
          {
            file: 'docs/mobile/android-release-path.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: '0'.repeat(64)
          },
          {
            file: 'docs/mobile/android-studio-testing.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: '0'.repeat(64)
          },
          {
            file: 'docs/mobile/play-store-submission-runbook.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: '0'.repeat(64)
          },
          {
            file: 'docs/compliance/privacy-policy.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: '0'.repeat(64)
          },
          {
            file: 'docs/compliance/play-store-data-safety-checklist.md',
            bytes: 1,
            lastModified: new Date().toISOString(),
            sha256: '0'.repeat(64)
          }
        ],
        checklist: ['a', 'b', 'c']
      },
      null,
      2
    )
  );

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_PACKET_PATH: badHashPath
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /sha256 mismatch/);
});
