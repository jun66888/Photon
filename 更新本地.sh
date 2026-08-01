#!/usr/bin/env bash
set -euo pipefail
PHOTON_HOME="/Users/liwei/Photon"
ROOT="$(cd "$(dirname "$0")" && pwd)"
# 优先用固定目录里的同步脚本；否则用当前目录
SYNC=""
if [[ -x "$PHOTON_HOME/sync-from-github.sh" ]]; then
  SYNC="$PHOTON_HOME/sync-from-github.sh"
elif [[ -x "$ROOT/sync-from-github.sh" ]]; then
  SYNC="$ROOT/sync-from-github.sh"
fi

if [[ -z "$SYNC" ]]; then
  echo "缺少 sync-from-github.sh，改用内嵌同步…"
  # 最小兜底：直接硬同步固定目录
  BRANCH="cursor/guangyingmeng-arena-f9c7"
  REPO="https://github.com/jun66888/Photon.git"
  if [[ ! -d "$PHOTON_HOME/.git" ]]; then
    rm -rf "$PHOTON_HOME"
    git clone -b "$BRANCH" "$REPO" "$PHOTON_HOME"
  else
    cd "$PHOTON_HOME"
    git fetch --force origin "$BRANCH"
    git checkout -B "$BRANCH" "origin/$BRANCH"
    git reset --hard "origin/$BRANCH"
  fi
else
  bash "$SYNC"
fi

echo ""
echo "下一步：运行 $PHOTON_HOME/start.sh"
echo "浏览器打开 http://127.0.0.1:3000/?mode=teacher （一般不用强刷了）"
