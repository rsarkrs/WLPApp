#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const REQUIRED_DOCS = [
  'docs/mobile/android-launch-readiness.md',
  'docs/mobile/android-release-path.md',
  'docs/mobile/android-studio-testing.md',
  'docs/mobile/play-store-submission-runbook.md',
  'docs/compliance/privacy-policy.md',
  'docs/compliance/play-store-data-safety-checklist.md'
];

const OUTPUT_DIR = path.join('artifacts', 'android');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'release-packet.json');

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function resolveSourceRevision() {
  const shaFromEnv = process.env.GITHUB_SHA;
  if (shaFromEnv && /^[a-f0-9]{40}$/i.test(shaFromEnv)) {
    return shaFromEnv.toLowerCase();
  }

  const result = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    console.error('android release packet generation failed: unable to resolve source revision');
    process.exit(1);
  }

  const revision = (result.stdout || '').trim().toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(revision)) {
    console.error('android release packet generation failed: resolved source revision is invalid');
    process.exit(1);
  }

  return revision;
}

for (const file of REQUIRED_DOCS) {
  if (!fs.existsSync(file)) {
    console.error(`android release packet generation failed: missing file ${file}`);
    process.exit(1);
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const generatedAt = new Date().toISOString();
const sourceRevision = resolveSourceRevision();
const ciRunId = (process.env.GITHUB_RUN_ID || '').trim() || null;
const ciRunAttempt = (process.env.GITHUB_RUN_ATTEMPT || '').trim() || null;
const packet = {
  generatedAt,
  sourceRevision,
  ciRunId,
  ciRunAttempt,
  docs: REQUIRED_DOCS.map((file) => {
    const stats = fs.statSync(file);
    return {
      file,
      bytes: stats.size,
      lastModified: stats.mtime.toISOString(),
      sha256: sha256File(file)
    };
  }),
  checklist: [
    'Android launch readiness gate executed',
    'Android release preflight executed with signing secrets',
    'Play Store submission runbook reviewed',
    'Privacy policy and Data Safety checklist are present'
  ]
};

fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');

console.log(`android release packet generated: ${OUTPUT_FILE}`);
