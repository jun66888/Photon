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

chmod +x "$ROOT"/*.sh "$ROOT"/*.command 2>/dev/null || true

# macOS 可双击运行的 .command —— 全部写死绝对路径
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

# 更新按钮：优先用仓库内自包含脚本；否则内嵌强力更新逻辑
if [[ -f "$ROOT/光影盟-更新.command" ]]; then
  cp -f "$ROOT/光影盟-更新.command" "$DESKTOP/光影盟-更新.command"
  cp -f "$ROOT/光影盟-更新.command" "$DESKTOP/GY-Update.command"
else
  cat > "$DESKTOP/光影盟-更新.command" <<EOF
#!/bin/bash
set -euo pipefail
PHOTON_HOME="$PHOTON_HOME"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"
cd "\$PHOTON_HOME" 2>/dev/null || true
if [[ -x "\$PHOTON_HOME/更新本地.sh" ]]; then
  "\$PHOTON_HOME/更新本地.sh"
elif [[ -d "\$PHOTON_HOME/.git" ]]; then
  cd "\$PHOTON_HOME"
  git fetch --force origin "\$PHOTON_BRANCH"
  git reset --hard "origin/\$PHOTON_BRANCH"
else
  echo "请先安装到 \$PHOTON_HOME"
fi
[[ -x "\$PHOTON_HOME/一键放到桌面.sh" ]] && "\$PHOTON_HOME/一键放到桌面.sh" >/dev/null 2>&1 || true
echo ""
read -r -p "按回车关闭…" _
EOF
  cp -f "$DESKTOP/光影盟-更新.command" "$DESKTOP/GY-Update.command"
fi

cat > "$DESKTOP/光影盟-诊断.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || exit 1
exec "$PHOTON_HOME/诊断本机.command"
EOF

cat > "$DESKTOP/光影盟-收藏地址.txt" <<EOF
光影盟 · 请收藏老师端（永远不变）

http://127.0.0.1:3000/?mode=teacher

上课前：双击桌面「光影盟-开始上课」或 GY-Start
更新代码：双击桌面「光影盟-更新」或 GY-Update

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
         "$DESKTOP/GY-Update.command" \
         "$DESKTOP/光影盟-诊断.command"

# 去掉 macOS 隔离属性，方便双击
xattr -cr "$DESKTOP/光影盟-更新.command" "$DESKTOP/GY-Update.command" \
  "$DESKTOP/光影盟-开始上课.command" "$DESKTOP/GY-Start.command" 2>/dev/null || true

echo ""
echo "  [完成] 已放到桌面：$DESKTOP"
echo "    光影盟-开始上课.command  ← 上课（会自动同步代码）"
echo "    光影盟-更新.command      ← 更新到最新（可双击）"
echo "    GY-Update.command        ← 同上英文名"
echo "    光影盟-诊断.command      ← 检查路径/版本"
echo "    光影盟-打开老师端.command"
echo ""
echo "  老师端：http://127.0.0.1:3000/?mode=teacher"
echo "  固定目录：$PHOTON_HOME"
echo ""

open "$DESKTOP" 2>/dev/null || true
