#!/bin/bash
# FishAI 持久化启动脚本
# 使用 setsid 确保进程独立于父终端

pkill -f "next dev" 2>/dev/null
sleep 2

> /home/z/my-project/server.log
> /home/z/my-project/web.log

cd /home/z/my-project/fishai-server
setsid npx next dev -p 3001 >> /home/z/my-project/server.log 2>&1 < /dev/null &
echo $! > /home/z/my-project/server.pid

cd /home/z/my-project
setsid npx next dev -p 3000 >> /home/z/my-project/web.log 2>&1 < /dev/null &
echo $! > /home/z/my-project/web.pid

echo "Started. PIDs saved."
