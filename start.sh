#!/usr/bin/env bash
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
# 始终在固定目录启动，避免开错副本
if [[ -d "$PHOTON_HOME" ]]; then
  ROOT="$PHOTON_HOME"
else
  ROOT="$(cd "$(dirname "$0")" && pwd)"
fi
cd "$ROOT"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机离线课堂"
echo "   启动前自动同步 GitHub"
echo "  ========================================"
echo ""
echo "  程序目录：$ROOT"

# 每次上课自动同步（可用 PHOTON_SKIP_SYNC=1 跳过）
if [[ "${PHOTON_SKIP_SYNC:-0}" != "1" ]]; then
  if [[ -x "$ROOT/sync-from-github.sh" ]]; then
    echo "  正在同步最新代码…"
    if bash "$ROOT/sync-from-github.sh"; then
      echo "  同步完成"
    else
      echo "  [警告] 同步失败，将用当前本地文件启动（可检查网络后重试）"
    fi
  elif [[ -d "$ROOT/.git" ]]; then
    echo "  正在 git 拉取…"
    git fetch --force origin cursor/guangyingmeng-arena-f9c7 2>/dev/null || true
    git checkout -B cursor/guangyingmeng-arena-f9c7 origin/cursor/guangyingmeng-arena-f9c7 2>/dev/null || true
    git reset --hard origin/cursor/guangyingmeng-arena-f9c7 2>/dev/null || true
  else
    echo "  [警告] 无法自动同步：目录不是 git 仓库"
    echo "         请运行：更新本地.sh 或重新克隆到 $PHOTON_HOME"
  fi
  echo ""
fi

echo "  主文件：$ROOT/index.html"
if [[ -f "$ROOT/gy-build.json" ]]; then
  echo "  版本：$(grep -o '"short": "[^"]*"' "$ROOT/gy-build.json" | head -1 | cut -d'"' -f4) · $(grep -o '"synced_at": "[^"]*"' "$ROOT/gy-build.json" | head -1 | cut -d'"' -f4)"
fi

if ! grep -q "ICE_MODE_DEFS" "$ROOT/index.html" 2>/dev/null; then
  echo "  [错误] index.html 仍是旧版（没有破冰游戏）"
  echo "         请有网时再运行一次本脚本，或执行：./更新本地.sh"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先在有网时安装一次：https://nodejs.org （选 LTS）"
  exit 1
fi

echo "  【请收藏老师端 · 永远不变】"
echo "    http://127.0.0.1:3000/?mode=teacher"
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
