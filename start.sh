#!/bin/bash

# Install and build frontend
cd /app/web
echo "Installing frontend dependencies..."
pnpm install
echo "Building frontend..."
pnpm build

# Start backend services
cd /app/agent
echo "Starting backend services..."
python pdf_api.py &
python main.py dev &

# Start frontend
cd /app/web
echo "Starting frontend..."
npm start &

echo "All services started!"
# Keep container running
wait