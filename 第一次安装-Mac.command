#!/bin/bash
# 只跑这一次：装到 ~/Photon，以后用「更新本地」即可
set -e
TARGET="$HOME/Photon"
echo "将安装/更新到: $TARGET"
mkdir -p "$TARGET"
if [ -d "$TARGET/.git" ]; then
  cd "$TARGET"
  git fetch origin cursor/guangyingmeng-arena-f9c7
  git checkout cursor/guangyingmeng-arena-f9c7
  git pull origin cursor/guangyingmeng-arena-f9c7
else
  rm -rf "$TARGET"
  git clone -b cursor/guangyingmeng-arena-f9c7 https://github.com/jun66888/Photon.git "$TARGET"
  cd "$TARGET"
fi
chmod +x start.sh 一键放到桌面.sh 一键放到桌面.command 更新本地.sh 更新本地.command 第一次安装-Mac.command 2>/dev/null || true
./一键放到桌面.sh
echo ""
echo "[完成] 项目在: $TARGET"
echo "以后更新：双击桌面旁边项目里的「更新本地.command」"
echo "或终端: cd ~/Photon && git pull && ./start.sh"
open "$TARGET"
read -r -p "按回车关闭…" _
