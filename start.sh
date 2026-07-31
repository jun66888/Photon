#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机离线课堂"
echo "   无需外网 · 学生现场局域网即可"
echo "  ========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先在有网时安装一次：https://nodejs.org （选 LTS）"
  echo "  装好后可完全断网上课。"
  exit 1
fi

echo "  电脑打开: http://localhost:3000/?mode=teacher"
echo "  扫码请看终端「固定扫码」局域网地址"
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
