#!/bin/bash
PHOTON_HOME="/Users/liwei/Photon"
cd "$PHOTON_HOME" 2>/dev/null || cd "$(dirname "$0")" || exit 1
chmod +x sync-from-github.sh 更新本地.sh 2>/dev/null || true
if [[ -x ./sync-from-github.sh ]]; then
  ./sync-from-github.sh
else
  ./更新本地.sh
fi
echo ""
echo "可直接运行 ./start.sh 开始上课（也会自动同步）"
read -r -p "按回车关闭…" _
