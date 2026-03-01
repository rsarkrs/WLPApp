'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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
            lastModified: new Date().toISOString()
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
