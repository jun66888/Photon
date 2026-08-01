#!/bin/bash
cd "$(dirname "$0")"
chmod +x 更新本地.sh 2>/dev/null || true
./更新本地.sh
echo ""
read -r -p "按回车关闭…" _
