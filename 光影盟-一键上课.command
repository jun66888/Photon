#!/bin/bash
# 光影盟 · 桌面一键上课（更新 + 启动环境 + 打开启动页）
set -euo pipefail
PHOTON_HOME="/Users/liwei/Photon"
cd "$PHOTON_HOME" || {
  echo "找不到 $PHOTON_HOME"
  echo "请先双击「光影盟-更新」或运行第一次安装"
  read -r -p "按回车关闭…" _
  exit 1
}
chmod +x 一键上课.sh start.sh sync-from-github.sh 2>/dev/null || true
exec "$PHOTON_HOME/一键上课.sh"
