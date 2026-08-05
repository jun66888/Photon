#!/bin/bash
# 只跑这一次：装到 /Users/liwei/Photon，以后用「更新本地」即可
set -e
PHOTON_HOME="/Users/liwei/Photon"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"
TARGET="$PHOTON_HOME"

echo "将安装/更新到固定目录: $TARGET"
mkdir -p "$(dirname "$TARGET")"
if [ -d "$TARGET/.git" ]; then
  cd "$TARGET"
  git fetch origin "$PHOTON_BRANCH"
  git checkout "$PHOTON_BRANCH"
  git pull origin "$PHOTON_BRANCH"
else
  if [ -e "$TARGET" ]; then
    BAK="${TARGET}-旧备份-$(date +%Y%m%d%H%M)"
    echo "已存在非 git 目录，备份到: $BAK"
    mv "$TARGET" "$BAK"
  fi
  git clone -b "$PHOTON_BRANCH" "$PHOTON_REPO" "$TARGET"
  cd "$TARGET"
fi
chmod +x start.sh 一键放到桌面.sh 一键放到桌面.command 更新本地.sh 更新本地.command 第一次安装-Mac.command 2>/dev/null || true
./一键放到桌面.sh
echo ""
echo "[完成] 项目固定在: $TARGET"
echo "以后更新：双击桌面「光影盟-更新」或运行："
echo "  cd /Users/liwei/Photon && ./更新本地.sh"
open "$TARGET"
read -r -p "按回车关闭…" _
