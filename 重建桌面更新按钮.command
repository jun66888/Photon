#!/bin/bash
# 双击：只把「更新」按钮重新放到桌面
PHOTON_HOME="/Users/liwei/Photon"
cd "$PHOTON_HOME" 2>/dev/null || {
  echo "找不到固定目录：$PHOTON_HOME"
  echo "请先运行第一次安装或克隆仓库"
  read -r -p "按回车关闭…" _
  exit 1
}
chmod +x 重建桌面更新按钮.sh 一键放到桌面.sh 光影盟-更新.command 2>/dev/null || true
if [[ -x ./重建桌面更新按钮.sh ]]; then
  bash ./重建桌面更新按钮.sh
else
  bash ./一键放到桌面.sh
fi
echo ""
read -r -p "按回车关闭…" _
