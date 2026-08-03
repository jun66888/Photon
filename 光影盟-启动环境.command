#!/bin/bash
# 光影盟 · 启动本机课堂环境（Node 服务 + 自动打开老师端）
# 关掉这个窗口 = 关掉前端；上课期间请保持窗口开着。
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PORT=3000
URL="http://127.0.0.1:${PORT}/?mode=teacher"

clear 2>/dev/null || true
echo "========================================"
echo "  光影盟 · 启动课堂环境"
echo "========================================"
echo ""
echo "  本窗口 = 前端服务环境"
echo "  关掉本窗口后，浏览器会打不开页面"
echo "  上课期间请保持本窗口开着"
echo ""
echo "  目录：$PHOTON_HOME"
echo "  地址：$URL"
echo "========================================"
echo ""

if [[ ! -d "$PHOTON_HOME" ]]; then
  echo "❌ 找不到 $PHOTON_HOME"
  echo "请先双击桌面「光影盟-更新」安装/同步代码"
  read -r -p "按回车关闭…" _
  exit 1
fi

cd "$PHOTON_HOME"
chmod +x start.sh sync-from-github.sh 2>/dev/null || true

# 若 3000 已被占用，先试着打开浏览器，不再重复起服务
if curl -fsS --max-time 1 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
  echo "→ 检测到服务已在运行，直接打开老师端…"
  open "$URL" 2>/dev/null || true
  echo ""
  echo "若页面仍空白，请关掉旧终端窗口后，再双击本按钮重启。"
  echo ""
  read -r -p "按回车关闭本提示窗（不会关掉已在跑的服务）…" _
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ 未检测到 Node.js（这就是需要的运行环境）"
  echo "请先安装：https://nodejs.org （选 LTS）"
  echo "装好后再双击本按钮。"
  read -r -p "按回车关闭…" _
  exit 1
fi

echo "→ 正在启动服务（会自动同步并打开浏览器）…"
echo "→ 看到下方日志后不要关窗"
echo ""

# 跳过二次确认：直接进 start.sh（内部会开浏览器）
export PHOTON_SKIP_SYNC="${PHOTON_SKIP_SYNC:-0}"
exec "$PHOTON_HOME/start.sh"
