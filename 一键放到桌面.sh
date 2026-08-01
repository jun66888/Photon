#!/usr/bin/env bash
# 光影盟 · 把常用入口放到 macOS 桌面（一律指向固定目录）
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
ROOT="$PHOTON_HOME"

if [[ ! -d "$ROOT" ]]; then
  echo "找不到固定目录：$ROOT"
  echo "请先运行：更新本地.sh 或 第一次安装-Mac.command"
  exit 1
fi
cd "$ROOT"

DESKTOP="${HOME}/Desktop"
if [[ ! -d "$DESKTOP" ]]; then
  DESKTOP="${HOME}/桌面"
fi
if [[ ! -d "$DESKTOP" ]]; then
  echo "找不到桌面文件夹：~/Desktop 或 ~/桌面"
  exit 1
fi

chmod +x "$ROOT/start.sh" "$ROOT/sync-from-github.sh" "$ROOT/更新本地.sh" "$ROOT/更新本地.command" \
         "$ROOT/一键放到桌面.sh" "$ROOT/打开老师端.command" "$ROOT/诊断本机.command" 2>/dev/null || true

# macOS 可双击运行的 .command —— 全部写死绝对路径；上课前自动同步
cat > "$DESKTOP/光影盟-开始上课.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || { echo "找不到 $PHOTON_HOME"; read -r -p "按回车关闭… " _; exit 1; }
chmod +x start.sh sync-from-github.sh 2>/dev/null || true
exec "$PHOTON_HOME/start.sh"
EOF

cat > "$DESKTOP/GY-Start.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || exit 1
chmod +x start.sh sync-from-github.sh 2>/dev/null || true
exec "$PHOTON_HOME/start.sh"
EOF

cat > "$DESKTOP/光影盟-打开老师端.command" <<EOF
#!/bin/bash
open "http://127.0.0.1:3000/?mode=teacher"
EOF

cat > "$DESKTOP/GY-Teacher.command" <<EOF
#!/bin/bash
open "http://127.0.0.1:3000/?mode=teacher"
EOF

cat > "$DESKTOP/光影盟-更新.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || exit 1
chmod +x sync-from-github.sh 更新本地.command 2>/dev/null || true
if [[ -x "$PHOTON_HOME/sync-from-github.sh" ]]; then
  "$PHOTON_HOME/sync-from-github.sh"
  echo ""
  read -r -p "按回车关闭… " _
else
  exec "$PHOTON_HOME/更新本地.command"
fi
EOF

cat > "$DESKTOP/光影盟-诊断.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || exit 1
exec "$PHOTON_HOME/诊断本机.command"
EOF

cat > "$DESKTOP/光影盟-收藏地址.txt" <<EOF
光影盟 · 请收藏老师端（永远不变）

http://127.0.0.1:3000/?mode=teacher

上课前：双击桌面「光影盟-开始上课」或 GY-Start
更新代码：双击桌面「光影盟-更新」

本机固定目录（唯一）：
$PHOTON_HOME

主文件：
$PHOTON_HOME/index.html

Mac 用 start.sh（不要用 start.bat）
手机扫码见 $PHOTON_HOME/固定访问地址.txt
EOF

cat > "$DESKTOP/光影盟-老师端.url" <<EOF
[InternetShortcut]
URL=http://127.0.0.1:3000/?mode=teacher
EOF

chmod +x "$DESKTOP/光影盟-开始上课.command" \
         "$DESKTOP/GY-Start.command" \
         "$DESKTOP/光影盟-打开老师端.command" \
         "$DESKTOP/GY-Teacher.command" \
         "$DESKTOP/光影盟-更新.command" \
         "$DESKTOP/光影盟-诊断.command"

echo ""
echo "  [完成] 已放到桌面：$DESKTOP"
echo "    光影盟-开始上课.command  ← 上课（会自动同步代码）"
echo "    光影盟-更新.command      ← 只同步不启动"
echo "    光影盟-诊断.command      ← 检查路径/版本"
echo "    光影盟-打开老师端.command"
echo ""
echo "  老师端：http://127.0.0.1:3000/?mode=teacher"
echo "  固定目录：$PHOTON_HOME"
echo ""

open "$DESKTOP" 2>/dev/null || true
open "$PHOTON_HOME" 2>/dev/null || true
