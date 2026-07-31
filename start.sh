#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机课堂启动（稳定模式）"
echo "   不依赖公网隧道 · 地址固定 · 断网可用"
echo "  ========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先安装一次：https://nodejs.org （选 LTS）"
  exit 1
fi

echo "  电脑打开: http://localhost:3000/?mode=teacher"
echo "  扫码请看终端打印的「固定扫码」地址（局域网）"
echo "  本窗口保持打开；异常退出会自动重启"
echo ""

(
  sleep 2
  url="http://localhost:3000/?mode=teacher"
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 || true
  fi
) &

while true; do
  node server.mjs && break
  code=$?
  echo ""
  echo "  [提示] 服务退出（代码 $code），3 秒后自动重启…"
  sleep 3
done
