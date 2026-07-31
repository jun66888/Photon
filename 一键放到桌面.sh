#!/usr/bin/env bash
# 光影盟 · 把常用入口放到 macOS 桌面
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
DESKTOP="${HOME}/Desktop"
if [[ ! -d "$DESKTOP" ]]; then
  DESKTOP="${HOME}/桌面"
fi
if [[ ! -d "$DESKTOP" ]]; then
  echo "找不到桌面文件夹：~/Desktop 或 ~/桌面"
  exit 1
fi

chmod +x "$ROOT/start.sh" "$ROOT/一键放到桌面.sh" 2>/dev/null || true

# macOS 可双击运行的 .command
cat > "$DESKTOP/光影盟-开始上课.command" <<EOF
#!/bin/bash
cd "$ROOT"
exec "$ROOT/start.sh"
EOF

cat > "$DESKTOP/GY-Start.command" <<EOF
#!/bin/bash
cd "$ROOT"
exec "$ROOT/start.sh"
EOF

cat > "$DESKTOP/光影盟-打开老师端.command" <<EOF
#!/bin/bash
open "http://127.0.0.1:3000/?mode=teacher"
EOF

cat > "$DESKTOP/GY-Teacher.command" <<EOF
#!/bin/bash
open "http://127.0.0.1:3000/?mode=teacher"
EOF

cat > "$DESKTOP/光影盟-收藏地址.txt" <<EOF
光影盟 · 请收藏老师端（永远不变）

http://127.0.0.1:3000/?mode=teacher

上课前：双击桌面「光影盟-开始上课」或 GY-Start
程序目录：
$ROOT

Mac 用 start.sh（不要用 start.bat）
手机扫码见程序目录「固定访问地址.txt」
EOF

# 老师端网页快捷方式
cat > "$DESKTOP/光影盟-老师端.url" <<EOF
[InternetShortcut]
URL=http://127.0.0.1:3000/?mode=teacher
EOF

chmod +x "$DESKTOP/光影盟-开始上课.command" \
         "$DESKTOP/GY-Start.command" \
         "$DESKTOP/光影盟-打开老师端.command" \
         "$DESKTOP/GY-Teacher.command"

echo ""
echo "  [完成] 已放到桌面：$DESKTOP"
echo "    光影盟-开始上课.command  或  GY-Start.command  ← 上课点这个"
echo "    光影盟-打开老师端.command / GY-Teacher.command"
echo "    光影盟-收藏地址.txt"
echo ""
echo "  老师端收藏：http://127.0.0.1:3000/?mode=teacher"
echo "  程序目录：$ROOT"
echo ""

# 打开桌面与程序目录，方便你看见
open "$DESKTOP" 2>/dev/null || true
open "$ROOT" 2>/dev/null || true
