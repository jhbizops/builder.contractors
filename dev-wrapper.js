#!/usr/bin/env node

// Wrapper script to handle the development server issues
// This script builds the application and runs it in production mode
// as a workaround for the Vite dev server issues

const { spawn } = require('child_process');

console.log('Starting application with workaround for Vite issues...');
console.log('Building application...');

// First, build the application
const build = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

build.on('close', (code) => {
  if (code !== 0) {
    console.error('Build failed with code', code);
    process.exit(code);
  }
  
  console.log('Build successful, starting server...');
  
  // Then start the production server
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  // Handle process termination
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    server.kill('SIGINT');
  });
});