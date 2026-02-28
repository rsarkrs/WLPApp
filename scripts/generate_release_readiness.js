const fs = require('node:fs');
const path = require('node:path');

const timestamp = new Date().toISOString();
const outputPath = path.join(process.cwd(), 'artifacts', 'release-readiness-checklist.md');

const checklist = `# Release Readiness Checklist\n\nGenerated: ${timestamp}\n\n## Required pre-deploy checks\n- [ ] npm run lint\n- [ ] npm run test:unit\n- [ ] npm run test:property\n- [ ] npm run test:integration\n- [ ] npm run test:contract\n- [ ] npm run coverage:engine\n- [ ] npm run coverage:check\n- [ ] npm run build\n\n## Deployment readiness notes\n- [ ] Verify rollback plan is documented for schema or contract changes.\n- [ ] Verify release train summary has no unresolved blockers.\n- [ ] Verify production environment variables are present and rotated where needed.\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, checklist, 'utf8');
console.log(`Wrote ${outputPath}`);
