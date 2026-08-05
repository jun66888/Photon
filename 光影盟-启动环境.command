#!/bin/bash
# 光影盟 · 启动环境（兼容旧桌面图标）
# 现已并入「一键上课」：自动更新 + 启动 + 打开启动页
set -euo pipefail
PHOTON_HOME="/Users/liwei/Photon"
cd "$PHOTON_HOME" || {
  echo "找不到 $PHOTON_HOME"
  echo "请先双击「光影盟-更新」或运行第一次安装"
  read -r -p "按回车关闭…" _
  exit 1
}
chmod +x 一键上课.sh 光影盟-一键上课.command start.sh 2>/dev/null || true
if [[ -x "$PHOTON_HOME/一键上课.sh" ]]; then
  exec "$PHOTON_HOME/一键上课.sh"
fi
exec "$PHOTON_HOME/start.sh"
