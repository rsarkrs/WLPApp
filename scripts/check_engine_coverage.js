const fs = require('node:fs');
const path = require('node:path');

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

const coverageTargets = [
  { file: 'src/domain/metabolicEngine.js', minimumLine: 90, minimumBranch: 85 },
  { file: 'src/planner/engine.js', minimumLine: 85, minimumBranch: 80 },
  { file: 'src/shopping/consolidation.js', minimumLine: 85, minimumBranch: 80 },
];

if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found at ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

function findCoverageEntry(targetPath) {
  const key = Object.keys(summary).find((entry) => entry.endsWith(targetPath));
  return key ? summary[key] : null;
}

let hasFailure = false;

for (const target of coverageTargets) {
  const entry = findCoverageEntry(target.file);
  if (!entry) {
    console.error(`Coverage summary is missing metrics for ${target.file}.`);
    hasFailure = true;
    continue;
  }

  const linePct = entry.lines?.pct ?? 0;
  const branchPct = entry.branches?.pct ?? 0;

  console.log(
    `${target.file} coverage => lines: ${linePct}% | branches: ${branchPct}% (required lines >= ${target.minimumLine}%, branches >= ${target.minimumBranch}%)`,
  );

  if (linePct < target.minimumLine || branchPct < target.minimumBranch) {
    hasFailure = true;
  }
}

if (hasFailure) {
  console.error('Coverage gate failed for one or more core engine modules.');
  process.exit(1);
}
