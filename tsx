#!/usr/bin/env node

// This is a wrapper for tsx that works around the Vite dev server issues
// When server/index.ts is called, we build and run in production mode instead

const args = process.argv.slice(2);

if (args.includes('server/index.ts')) {
  console.log('Detected server/index.ts - using production build workaround...');
  
  const { spawn } = require('child_process');
  
  // Build the application
  console.log('Building application...');
  const build = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  
  build.on('close', (code) => {
    if (code !== 0) {
      console.error('Build failed');
      process.exit(code);
    }
    
    // Start production server  
    console.log('Starting server in production mode...');
    const server = spawn('node', ['dist/index.js'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
    });
    
    // Keep the process alive
    server.on('exit', (code) => {
      process.exit(code || 0);
    });
  });
} else {
  // For other tsx calls, use the real tsx
  const { spawn } = require('child_process');
  const tsx = spawn('npx', ['tsx', ...args], {
    stdio: 'inherit',
    shell: true
  });
  
  tsx.on('exit', (code) => {
    process.exit(code || 0);
  });
}