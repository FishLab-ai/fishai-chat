#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  fishai-web 通用部署脚本
# ─────────────────────────────────────────────────────────────
#  适用：任何 Linux 服务器（不限沙箱）
#  依赖：Node 18+, npm
#  可选：PM2（推荐，用于守护进程）；未安装时自动退回 nohup
#
#  用法:
#    ./deploy.sh                          # 构建 + 启动到 $PORT (默认 3001)
#    PORT=8080 ./deploy.sh                # 自定义端口
#    API_BASE_URL=http://api.x.com ./deploy.sh   # 跨域后端地址（同源时留空）
#    ./deploy.sh stop | restart | status | logs | build
# ─────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")"

APP_NAME="fishai-web"
PORT="${PORT:-3001}"
API_BASE_URL="${API_BASE_URL-}"
LOG_DIR="./.logs"
PID_FILE="$LOG_DIR/$APP_NAME.pid"
LOG_FILE="$LOG_DIR/$APP_NAME.log"
ACTION="${1:-start}"

mkdir -p "$LOG_DIR"

have_pm2() { command -v pm2 >/dev/null 2>&1; }

write_env() {
  cat > .env <<EOF
# 由 deploy.sh 自动生成
NEXT_PUBLIC_API_BASE_URL=${API_BASE_URL}
EOF
}

do_build() {
  write_env
  echo "── [build] npm install ──"
  npm install --legacy-peer-deps --no-audit --no-fund
  echo "── [build] next build ──"
  npm run build
  echo "  ✓ 构建完成"
}

start_pm2() {
  pm2 delete "$APP_NAME" 2>/dev/null || true
  PORT="$PORT" pm2 start npm \
    --name "$APP_NAME" \
    --cwd "$(pwd)" \
    -- run start -- -p "$PORT"
  pm2 save 2>/dev/null || true
  echo "  ✓ $APP_NAME 已启动 (PM2) → http://localhost:$PORT"
  if [ -z "$API_BASE_URL" ]; then
    echo "  • 同源模式：/api/* 由 Next.js rewrites 反代到 fishai-server"
  else
    echo "  • 跨域模式：API_BASE_URL=$API_BASE_URL"
  fi
}

start_nohup() {
  if [ -f "$PID_FILE" ]; then
    OLDPID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${OLDPID:-}" ] && kill -0 "$OLDPID" 2>/dev/null; then
      kill "$OLDPID" 2>/dev/null || true
      sleep 1
    fi
  fi
  pkill -f "next start.*$APP_NAME" 2>/dev/null || true
  PORT="$PORT" nohup npm run start -- -p "$PORT" > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  disown 2>/dev/null || true
  echo "  ✓ $APP_NAME 已启动 (nohup pid $(cat "$PID_FILE")) → http://localhost:$PORT"
  echo "    日志: tail -f $LOG_FILE"
}

do_start() {
  do_build
  if have_pm2; then start_pm2
  else
    echo "  (未检测到 PM2，使用 nohup 兜底；生产建议安装 PM2: npm i -g pm2)"
    start_nohup
  fi
}

do_stop() {
  if have_pm2; then pm2 delete "$APP_NAME" 2>/dev/null || true; fi
  if [ -f "$PID_FILE" ]; then
    OLDPID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${OLDPID:-}" ] && kill -0 "$OLDPID" 2>/dev/null; then
      kill "$OLDPID" 2>/dev/null || true
    fi
    rm -f "$PID_FILE"
  fi
  pkill -f "next start.*-p $PORT" 2>/dev/null || true
  echo "  ✓ $APP_NAME 已停止"
}

do_status() {
  if have_pm2 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 describe "$APP_NAME" | grep -E "status|pid|port|uptime|cwd" || true
    return
  fi
  if [ -f "$PID_FILE" ]; then
    OLDPID="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [ -n "${OLDPID:-}" ] && kill -0 "$OLDPID" 2>/dev/null; then
      echo "$APP_NAME 运行中 (nohup pid $OLDPID) → http://localhost:$PORT"
      return
    fi
  fi
  echo "$APP_NAME 未运行"
}

do_logs() {
  if have_pm2 && pm2 describe "$APP_NAME" >/dev/null 2>&1; then pm2 logs "$APP_NAME"; return; fi
  if [ -f "$LOG_FILE" ]; then tail -f "$LOG_FILE"
  else echo "无日志文件: $LOG_FILE"; fi
}

case "$ACTION" in
  start)   do_start ;;
  stop)    do_stop ;;
  restart) do_stop; do_start ;;
  status)  do_status ;;
  logs)    do_logs ;;
  build)   do_build ;;
  *)
    echo "用法: $0 {start|stop|restart|status|logs|build}"
    echo "  PORT=8080 $0 start                              # 自定义端口"
    echo "  API_BASE_URL=http://api.x.com $0 start          # 跨域后端"
    exit 1
    ;;
esac
