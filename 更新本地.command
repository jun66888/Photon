#!/bin/bash
PHOTON_HOME="/Users/liwei/Photon"
cd "$PHOTON_HOME" || {
  echo "找不到固定目录：$PHOTON_HOME"
  read -r -p "按回车关闭…" _
  exit 1
}
chmod +x 更新本地.sh 2>/dev/null || true
./更新本地.sh
echo ""
read -r -p "按回车关闭…" _
