#!/bin/bash
# 打开老师端 / 启动台；若服务未运行则走一键上课
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PORT=3000
URL="http://127.0.0.1:${PORT}/?mode=teacher"
HUB="http://127.0.0.1:${PORT}/launcher.html"

if curl -fsS --max-time 1 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  open "$HUB" 2>/dev/null || true
  open "$URL" 2>/dev/null || true
  exit 0
fi

echo "服务未运行，正在一键上课（更新+启动）…"
echo "（请保持接下来弹出的窗口开着）"
if [[ -x "$PHOTON_HOME/光影盟-一键上课.command" ]]; then
  open "$PHOTON_HOME/光影盟-一键上课.command"
elif [[ -x "$PHOTON_HOME/一键上课.sh" ]]; then
  open "$PHOTON_HOME/一键上课.sh"
elif [[ -x "$PHOTON_HOME/光影盟-启动环境.command" ]]; then
  open "$PHOTON_HOME/光影盟-启动环境.command"
elif [[ -x "$PHOTON_HOME/start.sh" ]]; then
  open "$PHOTON_HOME/start.sh"
else
  echo "找不到启动脚本：$PHOTON_HOME"
  read -r -p "按回车关闭…" _
  exit 1
fi
