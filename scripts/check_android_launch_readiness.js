const fs = require('node:fs');
const path = require('node:path');

const requiredFiles = [
  'docs/mobile/android-launch-readiness.md',
  'docs/mobile/play-store-submission-runbook.md',
  'docs/compliance/privacy-policy.md',
  'docs/compliance/play-store-data-safety-checklist.md',
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));

if (missing.length > 0) {
  console.error('Android launch readiness gate failed. Missing required files:');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('Android launch readiness baseline files present.');
