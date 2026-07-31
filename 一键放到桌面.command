#!/bin/bash
cd "$(dirname "$0")"
chmod +x "./一键放到桌面.sh" "./start.sh" 2>/dev/null || true
./一键放到桌面.sh
echo ""
read -r -p "按回车关闭…" _
