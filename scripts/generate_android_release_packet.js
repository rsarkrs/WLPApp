#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

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

for (const file of REQUIRED_DOCS) {
  if (!fs.existsSync(file)) {
    console.error(`android release packet generation failed: missing file ${file}`);
    process.exit(1);
  }
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const generatedAt = new Date().toISOString();
const packet = {
  generatedAt,
  docs: REQUIRED_DOCS.map((file) => {
    const stats = fs.statSync(file);
    return {
      file,
      bytes: stats.size,
      lastModified: stats.mtime.toISOString()
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
