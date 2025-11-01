#!/bin/bash

# Build the application first
echo "Building application..."
npm run build

# Start the production server
echo "Starting server in production mode..."
NODE_ENV=production PORT=5000 node dist/index.js