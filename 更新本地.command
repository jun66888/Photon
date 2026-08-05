#!/bin/bash
# 光影盟 · 更新（双击运行）
PHOTON_HOME="/Users/liwei/Photon"
cd "$PHOTON_HOME" 2>/dev/null || cd "$(dirname "$0")" || exit 1
chmod +x 更新本地.sh 光影盟-更新.command 一键放到桌面.sh 2>/dev/null || true
if [[ -x ./光影盟-更新.command ]]; then
  exec ./光影盟-更新.command
fi
if [[ -x ./更新本地.sh ]]; then
  ./更新本地.sh
  [[ -x ./一键放到桌面.sh ]] && ./一键放到桌面.sh || true
  echo ""
  read -r -p "按回车关闭…" _
  exit 0
fi
echo "找不到更新脚本"
read -r -p "按回车关闭…" _
exit 1
