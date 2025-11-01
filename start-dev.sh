#!/bin/bash

# Build the application first
echo "Building application..."
npm run build

# Start the production server with NODE_ENV=development for hot reload benefits
echo "Starting server..."
NODE_ENV=production PORT=5000 node dist/index.js