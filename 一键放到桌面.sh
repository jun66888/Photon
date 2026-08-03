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

# ★ 主入口：一键上课（更新 + 启动环境 + 打开启动台）
# 同时保留旧名「启动环境 / 开始上课 / GY-Start」，都指向同一套流程
ONECLICK_SRC=""
if [[ -f "$ROOT/光影盟-一键上课.command" ]]; then
  ONECLICK_SRC="$ROOT/光影盟-一键上课.command"
elif [[ -f "$ROOT/一键上课.sh" ]]; then
  cat > "$ROOT/光影盟-一键上课.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || exit 1
exec "$PHOTON_HOME/一键上课.sh"
EOF
  chmod +x "$ROOT/光影盟-一键上课.command"
  ONECLICK_SRC="$ROOT/光影盟-一键上课.command"
elif [[ -f "$ROOT/光影盟-启动环境.command" ]]; then
  ONECLICK_SRC="$ROOT/光影盟-启动环境.command"
fi

if [[ -n "$ONECLICK_SRC" ]]; then
  cp -f "$ONECLICK_SRC" "$DESKTOP/光影盟-一键上课.command"
  cp -f "$ONECLICK_SRC" "$DESKTOP/光影盟-开始上课.command"
  cp -f "$ONECLICK_SRC" "$DESKTOP/光影盟-启动环境.command"
  cp -f "$ONECLICK_SRC" "$DESKTOP/GY-Start.command"
fi

# 打开老师端：服务没开则自动走一键上课
if [[ -f "$ROOT/打开老师端.command" ]]; then
  cp -f "$ROOT/打开老师端.command" "$DESKTOP/光影盟-打开老师端.command"
  cp -f "$ROOT/打开老师端.command" "$DESKTOP/GY-Teacher.command"
else
  cat > "$DESKTOP/光影盟-打开老师端.command" <<EOF
#!/bin/bash
URL="http://127.0.0.1:3000/?mode=teacher"
HUB="http://127.0.0.1:3000/launcher.html"
if curl -fsS --max-time 1 "http://127.0.0.1:3000/" >/dev/null 2>&1; then
  open "\$HUB"
  open "\$URL"
else
  open "$PHOTON_HOME/光影盟-一键上课.command"
fi
EOF
  cp -f "$DESKTOP/光影盟-打开老师端.command" "$DESKTOP/GY-Teacher.command"
fi

# 环境说明（纯文本，双击用文本编辑打开）
if [[ -f "$ROOT/光影盟-环境说明.txt" ]]; then
  cp -f "$ROOT/光影盟-环境说明.txt" "$DESKTOP/光影盟-环境说明.txt"
fi

# ★ 更新按钮：每次强制重建（多个别名，避免找不到）
if [[ ! -f "$ROOT/光影盟-更新.command" ]]; then
  cat > "$ROOT/光影盟-更新.command" <<EOF
#!/bin/bash
set -euo pipefail
PHOTON_HOME="$PHOTON_HOME"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"
cd "\$PHOTON_HOME" 2>/dev/null || true
if [[ -x "\$PHOTON_HOME/更新本地.sh" ]]; then
  bash "\$PHOTON_HOME/更新本地.sh"
elif [[ -d "\$PHOTON_HOME/.git" ]]; then
  cd "\$PHOTON_HOME"
  git fetch --force origin "\$PHOTON_BRANCH"
  git reset --hard "origin/\$PHOTON_BRANCH"
else
  echo "请先安装到 \$PHOTON_HOME"
fi
[[ -x "\$PHOTON_HOME/一键放到桌面.sh" ]] && bash "\$PHOTON_HOME/一键放到桌面.sh" >/dev/null 2>&1 || true
echo ""
read -r -p "按回车关闭…" _
EOF
fi
chmod +x "$ROOT/光影盟-更新.command" 2>/dev/null || true
for name in "光影盟-更新.command" "GY-Update.command" "光影盟-更新代码.command"; do
  cp -f "$ROOT/光影盟-更新.command" "$DESKTOP/$name"
  chmod +x "$DESKTOP/$name"
done
# 最短名：更新.command（最好认）
cat > "$DESKTOP/更新.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" 2>/dev/null || true
if [[ -x "$PHOTON_HOME/光影盟-更新.command" ]]; then
  exec "$PHOTON_HOME/光影盟-更新.command"
fi
if [[ -x "$PHOTON_HOME/更新本地.sh" ]]; then
  bash "$PHOTON_HOME/更新本地.sh"
  echo ""
  read -r -p "按回车关闭…" _
  exit 0
fi
echo "找不到更新脚本"
read -r -p "按回车关闭…" _
exit 1
EOF
chmod +x "$DESKTOP/更新.command"

cat > "$DESKTOP/光影盟-诊断.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" || exit 1
exec "$PHOTON_HOME/诊断本机.command"
EOF

cat > "$DESKTOP/光影盟-收藏地址.txt" <<EOF
光影盟 · 请收藏（永远不变）

老师端：http://127.0.0.1:3000/?mode=teacher
启动台：http://127.0.0.1:3000/launcher.html

【只需这一个】
双击桌面「光影盟-一键上课」（或「开始上课」/ GY-Start）
→ 自动：更新代码 + 启动服务/隧道 + 打开启动台与老师端
→ 上课期间不要关黑色终端窗口

启动台里可点：老师端 / 签到入口 / 重建公网隧道 / 看状态

可选：
• 更新 / 光影盟-更新 / GY-Update：只更新、不开课
• 光影盟-打开老师端：只开浏览器
• 光影盟-诊断：排查问题

本机固定目录：$PHOTON_HOME
需要：Node.js（装一次）
EOF

cat > "$DESKTOP/光影盟-老师端.url" <<EOF
[InternetShortcut]
URL=http://127.0.0.1:3000/?mode=teacher
EOF

chmod +x "$DESKTOP/光影盟-一键上课.command" \
         "$DESKTOP/光影盟-启动环境.command" \
         "$DESKTOP/光影盟-开始上课.command" \
         "$DESKTOP/GY-Start.command" \
         "$DESKTOP/光影盟-打开老师端.command" \
         "$DESKTOP/GY-Teacher.command" \
         "$DESKTOP/更新.command" \
         "$DESKTOP/光影盟-更新.command" \
         "$DESKTOP/GY-Update.command" \
         "$DESKTOP/光影盟-更新代码.command" \
         "$DESKTOP/光影盟-诊断.command" \
         "$PHOTON_HOME/光影盟-一键上课.command" \
         "$PHOTON_HOME/一键上课.sh" \
         "$PHOTON_HOME/光影盟-更新.command" \
         "$PHOTON_HOME/重建桌面更新按钮.sh" \
         "$PHOTON_HOME/光影盟-启动环境.command" \
         "$PHOTON_HOME/打开老师端.command" 2>/dev/null || true

# 去掉 macOS 隔离属性，方便双击
xattr -cr "$DESKTOP/光影盟-一键上课.command" \
  "$DESKTOP/更新.command" \
  "$DESKTOP/光影盟-更新.command" "$DESKTOP/GY-Update.command" \
  "$DESKTOP/光影盟-更新代码.command" \
  "$DESKTOP/光影盟-启动环境.command" "$DESKTOP/光影盟-开始上课.command" \
  "$DESKTOP/GY-Start.command" "$DESKTOP/光影盟-打开老师端.command" 2>/dev/null || true

echo ""
echo "  [完成] 已放到桌面：$DESKTOP"
echo "    光影盟-一键上课.command  ← 上课：更新+启动+启动台"
echo "    更新.command             ← ★ 只更新（最短名）"
echo "    光影盟-更新.command      ← 只更新"
echo "    GY-Update.command        ← 只更新（英文名）"
echo "    光影盟-更新代码.command  ← 只更新（备用名）"
echo "    光影盟-打开老师端.command← 只开浏览器"
echo "    光影盟-诊断.command      ← 检查路径/版本"
echo ""
echo "  启动台：http://127.0.0.1:3000/launcher.html"
echo "  老师端：http://127.0.0.1:3000/?mode=teacher"
echo "  固定目录：$PHOTON_HOME"
echo ""

open "$DESKTOP" 2>/dev/null || true
