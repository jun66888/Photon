#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机离线课堂"
echo "   地址永久固定 · 无需外网"
echo "  ========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先在有网时安装一次：https://nodejs.org （选 LTS）"
  exit 1
fi

echo "  【请收藏老师端 · 永远不变】"
echo "    http://127.0.0.1:3000/?mode=teacher"
echo "  手机扫码地址见「固定访问地址.txt」（锁定后不自动换）"
echo ""

(
  sleep 2
  url="http://127.0.0.1:3000/?mode=teacher"
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
