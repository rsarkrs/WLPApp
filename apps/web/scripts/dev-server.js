const { spawn } = require('node:child_process');
const path = require('node:path');

const port = String(process.env.PORT || 3000);
const nextBin = path.resolve(__dirname, '..', '..', '..', 'node_modules', '.bin', process.platform === 'win32' ? 'next.cmd' : 'next');

const child = spawn(nextBin, ['dev', '--port', port], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
