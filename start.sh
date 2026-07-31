#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机启动（主用，不依赖公网）"
echo "  ========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先安装一次：https://nodejs.org （选 LTS）"
  echo "  安装后重新运行。无需每次联网。"
  exit 1
fi

echo "  老师端: http://localhost:3000/?mode=teacher"
echo "  手机同 Wi-Fi：看终端打印的「手机同网」地址"
echo "  公网隧道仅作备用；按 Ctrl+C 停止"
echo ""

(
  sleep 2
  url="http://localhost:3000/?mode=teacher"
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 || true
  fi
) &

exec node server.mjs
