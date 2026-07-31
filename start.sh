#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机启动（不依赖外网）"
echo "  ========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先安装：https://nodejs.org （选 LTS）"
  exit 1
fi

if [[ ! -d node_modules ]]; then
  echo "  首次运行，正在 npm install …"
  npm install
fi

echo "  电脑老师端: http://localhost:3000/?mode=teacher"
echo "  手机请用终端打印的「手机同网」地址（不要扫 localhost）"
echo "  按 Ctrl+C 可停止服务"
echo ""

# 延迟打开浏览器（有桌面环境时）
(
  sleep 2
  url="http://localhost:3000/?mode=teacher"
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 || true
  fi
) &

exec node server.mjs
