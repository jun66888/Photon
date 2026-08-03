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
# 启动环境（主入口）：关掉窗口=关掉前端
if [[ -f "$ROOT/光影盟-启动环境.command" ]]; then
  cp -f "$ROOT/光影盟-启动环境.command" "$DESKTOP/光影盟-启动环境.command"
  cp -f "$ROOT/光影盟-启动环境.command" "$DESKTOP/光影盟-开始上课.command"
  cp -f "$ROOT/光影盟-启动环境.command" "$DESKTOP/GY-Start.command"
else
  cat > "$DESKTOP/光影盟-启动环境.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || { echo "找不到 $PHOTON_HOME"; read -r -p "按回车关闭… " _; exit 1; }
chmod +x start.sh sync-from-github.sh 2>/dev/null || true
exec "$PHOTON_HOME/start.sh"
EOF
  cp -f "$DESKTOP/光影盟-启动环境.command" "$DESKTOP/光影盟-开始上课.command"
  cp -f "$DESKTOP/光影盟-启动环境.command" "$DESKTOP/GY-Start.command"
fi

# 打开老师端：服务没开则自动启动
if [[ -f "$ROOT/打开老师端.command" ]]; then
  cp -f "$ROOT/打开老师端.command" "$DESKTOP/光影盟-打开老师端.command"
  cp -f "$ROOT/打开老师端.command" "$DESKTOP/GY-Teacher.command"
else
  cat > "$DESKTOP/光影盟-打开老师端.command" <<EOF
#!/bin/bash
URL="http://127.0.0.1:3000/?mode=teacher"
if curl -fsS --max-time 1 "http://127.0.0.1:3000/" >/dev/null 2>&1; then
  open "\$URL"
else
  open "$PHOTON_HOME/光影盟-启动环境.command"
fi
EOF
  cp -f "$DESKTOP/光影盟-打开老师端.command" "$DESKTOP/GY-Teacher.command"
fi

# 环境说明（纯文本，双击用文本编辑打开）
if [[ -f "$ROOT/光影盟-环境说明.txt" ]]; then
  cp -f "$ROOT/光影盟-环境说明.txt" "$DESKTOP/光影盟-环境说明.txt"
fi

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

【先开环境，再上课】
双击桌面「光影盟-启动环境」或「光影盟-开始上课」
→ 会弹出黑色终端窗口，这就是前端服务环境
→ 上课期间不要关这个窗口；关掉后页面会打不开

只开浏览器：双击「光影盟-打开老师端」（没服务会自动启动）
更新代码：双击「光影盟-更新」或 GY-Update
详细说明：桌面「光影盟-环境说明.txt」

本机固定目录（唯一）：
$PHOTON_HOME

主文件：
$PHOTON_HOME/index.html

需要的环境：Node.js（装一次）+ 上面这个启动窗口（每次上课开）
Mac 用 start.sh / 启动环境按钮（不要用 start.bat）
EOF

cat > "$DESKTOP/光影盟-老师端.url" <<EOF
[InternetShortcut]
URL=http://127.0.0.1:3000/?mode=teacher
EOF

chmod +x "$DESKTOP/光影盟-启动环境.command" \
         "$DESKTOP/光影盟-开始上课.command" \
         "$DESKTOP/GY-Start.command" \
         "$DESKTOP/光影盟-打开老师端.command" \
         "$DESKTOP/GY-Teacher.command" \
         "$DESKTOP/光影盟-更新.command" \
         "$DESKTOP/GY-Update.command" \
         "$DESKTOP/光影盟-诊断.command" \
         "$PHOTON_HOME/光影盟-启动环境.command" \
         "$PHOTON_HOME/打开老师端.command" 2>/dev/null || true

# 去掉 macOS 隔离属性，方便双击
xattr -cr "$DESKTOP/光影盟-更新.command" "$DESKTOP/GY-Update.command" \
  "$DESKTOP/光影盟-启动环境.command" "$DESKTOP/光影盟-开始上课.command" \
  "$DESKTOP/GY-Start.command" "$DESKTOP/光影盟-打开老师端.command" 2>/dev/null || true

echo ""
echo "  [完成] 已放到桌面：$DESKTOP"
echo "    光影盟-启动环境.command  ← ★ 打开前端环境（关窗=关掉前端）"
echo "    光影盟-开始上课.command  ← 同上"
echo "    光影盟-环境说明.txt      ← 需要开什么、怎么用"
echo "    光影盟-打开老师端.command← 开浏览器（没服务会自动启动）"
echo "    光影盟-更新.command      ← 更新到最新"
echo "    光影盟-诊断.command      ← 检查路径/版本"
echo ""
echo "  老师端：http://127.0.0.1:3000/?mode=teacher"
echo "  固定目录：$PHOTON_HOME"
echo ""

open "$DESKTOP" 2>/dev/null || true
