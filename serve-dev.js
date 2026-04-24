#!/usr/bin/env node
// Simple wrapper to start expo with PTY allocation
const { execSync, spawn } = require('child_process');
const path = require('path');

const child = spawn('script', ['-q', '/dev/null',
  path.join(__dirname, 'node_modules/.bin/expo'), 'start', '--web', '--port', '8083'
], {
  cwd: __dirname,
  env: { ...process.env, BROWSER: 'none' },
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code || 0));
process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
