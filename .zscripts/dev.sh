#!/bin/bash
# FishAI production server startup script
# This script is called by /start.sh at container boot time

cd /home/z/my-project

# Build if needed
if [ ! -f .next/BUILD_ID ]; then
  echo "[FishAI] Building project..."
  npx next build
fi

# Start production server
echo "[FishAI] Starting production server on port 3000..."
exec npx next start -p 3000 -H 0.0.0.0
