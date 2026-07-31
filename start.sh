#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo ""
echo "  光影盟 · 本地启动"
echo "  电脑: http://localhost:3000/?mode=teacher"
echo "  手机请用终端里打印的「手机同网」地址（不要扫 localhost）"
echo "  按 Ctrl+C 可停止服务"
echo ""
node server.mjs
