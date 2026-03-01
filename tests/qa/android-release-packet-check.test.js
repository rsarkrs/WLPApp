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
        sourceRevision: 'a'.repeat(40),
        sourceRevision: 'a'.repeat(40),
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
        sourceRevision: 'a'.repeat(40),
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


test('release packet checker fails when sourceRevision is invalid', () => {
  const badRevisionPath = path.join('.tmp', 'bad-release-packet-revision.json');
  fs.mkdirSync('.tmp', { recursive: true });

  const gen = run('node', ['scripts/generate_android_release_packet.js']);
  assert.equal(gen.status, 0, gen.stderr);

  const packet = JSON.parse(fs.readFileSync('artifacts/android/release-packet.json', 'utf8'));
  packet.sourceRevision = 'not-a-sha';
  fs.writeFileSync(badRevisionPath, JSON.stringify(packet, null, 2));

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_PACKET_PATH: badRevisionPath
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /sourceRevision must be a 40-char git sha/);
});


test('release packet checker fails when expected source revision does not match packet', () => {
  fs.rmSync('artifacts/android', { recursive: true, force: true });

  const gen = run('node', ['scripts/generate_android_release_packet.js']);
  assert.equal(gen.status, 0, gen.stderr);

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_EXPECTED_SOURCE_REVISION: 'f'.repeat(40)
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /sourceRevision mismatch/);
});


test('release packet checker fails when ci run metadata is malformed', () => {
  const badCiPath = path.join('.tmp', 'bad-release-packet-ci.json');
  fs.mkdirSync('.tmp', { recursive: true });

  const gen = run('node', ['scripts/generate_android_release_packet.js']);
  assert.equal(gen.status, 0, gen.stderr);

  const packet = JSON.parse(fs.readFileSync('artifacts/android/release-packet.json', 'utf8'));
  packet.ciRunId = 'run-x';
  fs.writeFileSync(badCiPath, JSON.stringify(packet, null, 2));

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_PACKET_PATH: badCiPath
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /ciRunId must be numeric when present/);
});


test('release packet checker fails when expected CI run id does not match packet', () => {
  const gen = run('node', ['scripts/generate_android_release_packet.js'], {
    GITHUB_RUN_ID: '100',
    GITHUB_RUN_ATTEMPT: '2'
  });
  assert.equal(gen.status, 0, gen.stderr);

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_EXPECTED_CI_RUN_ID: '101'
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /ciRunId mismatch/);
});

test('release packet checker fails when expected CI run attempt does not match packet', () => {
  const gen = run('node', ['scripts/generate_android_release_packet.js'], {
    GITHUB_RUN_ID: '100',
    GITHUB_RUN_ATTEMPT: '2'
  });
  assert.equal(gen.status, 0, gen.stderr);

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_EXPECTED_CI_RUN_ATTEMPT: '3'
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /ciRunAttempt mismatch/);
});


test('release packet checker fails when expected CI workflow does not match packet', () => {
  const gen = run('node', ['scripts/generate_android_release_packet.js'], {
    GITHUB_WORKFLOW: 'Android Release Baseline (TWA)'
  });
  assert.equal(gen.status, 0, gen.stderr);

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_EXPECTED_CI_WORKFLOW: 'Different Workflow'
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /ciWorkflow mismatch/);
});

test('release packet checker fails when expected CI run number does not match packet', () => {
  const gen = run('node', ['scripts/generate_android_release_packet.js'], {
    GITHUB_RUN_NUMBER: '55'
  });
  assert.equal(gen.status, 0, gen.stderr);

  const check = run('node', ['scripts/check_android_release_packet.js'], {
    ANDROID_RELEASE_EXPECTED_CI_RUN_NUMBER: '56'
  });

  assert.equal(check.status, 1);
  assert.match(check.stderr, /ciRunNumber mismatch/);
});
