#!/usr/bin/env node

// This script replaces the dev server with a production build
// to work around the Vite dev server issues

const { execSync, spawn } = require('child_process');

console.log('Starting application (production mode workaround)...');

try {
  // Build the application
  console.log('Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Start the production server
  console.log('Starting server...');
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
  });
  
  // Handle termination signals
  process.on('SIGTERM', () => server.kill('SIGTERM'));
  process.on('SIGINT', () => server.kill('SIGINT'));
  
  server.on('exit', (code) => {
    process.exit(code || 0);
  });
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}