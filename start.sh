#!/bin/bash
# Start fishai-server and fishai-web

# Kill any existing processes
pkill -f "next dev" 2>/dev/null
sleep 1

# Start fishai-server on port 3001
cd /home/z/my-project/fishai-server
nohup npx next dev -p 3001 > /home/z/my-project/server.log 2>&1 &
echo "fishai-server started (PID: $!)"

# Start fishai-web on port 3000
cd /home/z/my-project
nohup npx next dev -p 3000 > /home/z/my-project/web.log 2>&1 &
echo "fishai-web started (PID: $!)"

echo "Waiting for servers..."
sleep 12

# Check status
echo ""
echo "=== fishai-server ==="
curl -s -o /dev/null -w "HTTP: %{http_code}" http://localhost:3001/api/auth/github/config 2>/dev/null || echo "FAILED"

echo ""
echo "=== fishai-web ==="
curl -s -o /dev/null -w "HTTP: %{http_code}" http://localhost:3000 2>/dev/null || echo "FAILED"

echo ""
echo "Done! fishai-web: http://localhost:3000, fishai-server: http://localhost:3001"
