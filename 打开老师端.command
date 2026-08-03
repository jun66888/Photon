#!/bin/bash
# 打开老师端；若服务未运行则先启动环境
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PORT=3000
URL="http://127.0.0.1:${PORT}/?mode=teacher"

if curl -fsS --max-time 1 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

echo "服务未运行，正在启动课堂环境…"
echo "（请保持接下来弹出的窗口开着）"
if [[ -x "$PHOTON_HOME/光影盟-启动环境.command" ]]; then
  open "$PHOTON_HOME/光影盟-启动环境.command"
elif [[ -x "$PHOTON_HOME/start.sh" ]]; then
  open "$PHOTON_HOME/start.sh"
else
  echo "找不到启动脚本：$PHOTON_HOME"
  read -r -p "按回车关闭…" _
  exit 1
fi
