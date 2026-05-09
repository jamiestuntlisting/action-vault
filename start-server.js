const { spawn } = require('child_process');
const path = require('path');
const pty = require('node-pty') || null;

// Fallback: use script command to allocate a PTY
const args = ['expo', 'start', '--web', '--port', '8083'];
const env = { ...process.env, BROWSER: 'none', EXPO_NO_TELEMETRY: '1' };

const child = spawn('script', ['-q', '/dev/null', 'npx', ...args], {
  cwd: __dirname,
  env,
  stdio: ['ignore', 'inherit', 'inherit'],
});

child.on('exit', (code) => {
  console.log('Expo exited with code', code);
  process.exit(code);
});

process.on('SIGTERM', () => child.kill());
process.on('SIGINT', () => child.kill());
