#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo ""
echo "  光影盟 · 本地启动"
echo "  浏览器打开: http://localhost:3000/?mode=teacher"
echo "  按 Ctrl+C 可停止服务"
echo ""
npx --yes serve -l 3000 .
