#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
EXPECTED="/Users/liwei/Photon"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机离线课堂"
echo "   地址永久固定 · 无需外网"
echo "  ========================================"
echo ""
echo "  程序目录：$ROOT"
echo "  主文件  ：$ROOT/index.html"
if [[ "$ROOT" != "$EXPECTED" ]]; then
  echo "  [注意] 期望目录是 $EXPECTED"
  echo "         若页面一直不更新，请到期望目录执行 ./更新本地.sh"
fi
if ! grep -q "settings-play-top" "$ROOT/index.html" 2>/dev/null; then
  echo "  [警告] 当前 index.html 没有「玩法模式」，是旧文件。"
  echo "         请先运行：./更新本地.sh"
  echo ""
fi

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
