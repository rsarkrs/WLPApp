const fs = require('node:fs');
const path = require('node:path');

const summaryPath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
const minimumLine = 90;
const minimumBranch = 85;

if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found at ${summaryPath}`);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const total = summary.total;

if (!total) {
  console.error('Coverage summary is missing "total" metrics.');
  process.exit(1);
}

const linePct = total.lines?.pct ?? 0;
const branchPct = total.branches?.pct ?? 0;

console.log(`metabolicEngine coverage => lines: ${linePct}% | branches: ${branchPct}%`);

if (linePct < minimumLine || branchPct < minimumBranch) {
  console.error(
    `Coverage gate failed. Required lines >= ${minimumLine}% and branches >= ${minimumBranch}%.`,
  );
  process.exit(1);
}
