#!/usr/bin/env bash
# 光影盟 · 只重建桌面「更新」按钮（不改其它快捷方式）
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"

DESKTOP="${HOME}/Desktop"
if [[ ! -d "$DESKTOP" ]]; then
  DESKTOP="${HOME}/桌面"
fi
if [[ ! -d "$DESKTOP" ]]; then
  echo "找不到桌面文件夹：~/Desktop 或 ~/桌面"
  exit 1
fi

# 仓库里没有更新脚本时，先写一份到固定目录
if [[ ! -f "$PHOTON_HOME/光影盟-更新.command" ]]; then
  mkdir -p "$PHOTON_HOME"
  cat > "$PHOTON_HOME/光影盟-更新.command" <<'INNER'
#!/bin/bash
set -euo pipefail
PHOTON_HOME="/Users/liwei/Photon"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"
cd "$PHOTON_HOME" 2>/dev/null || true
if [[ -x "$PHOTON_HOME/更新本地.sh" ]]; then
  bash "$PHOTON_HOME/更新本地.sh"
elif [[ -d "$PHOTON_HOME/.git" ]]; then
  cd "$PHOTON_HOME"
  git fetch --force origin "$PHOTON_BRANCH"
  git reset --hard "origin/$PHOTON_BRANCH"
else
  echo "请先安装到 $PHOTON_HOME"
  read -r -p "按回车关闭…" _
  exit 1
fi
[[ -x "$PHOTON_HOME/一键放到桌面.sh" ]] && bash "$PHOTON_HOME/一键放到桌面.sh" || true
[[ -x "$PHOTON_HOME/重建桌面更新按钮.sh" ]] && bash "$PHOTON_HOME/重建桌面更新按钮.sh" || true
echo ""
read -r -p "按回车关闭…" _
INNER
fi

chmod +x "$PHOTON_HOME/光影盟-更新.command" 2>/dev/null || true

# 桌面写入多个别名，避免找不到
for name in "光影盟-更新.command" "GY-Update.command" "光影盟-更新代码.command"; do
  cp -f "$PHOTON_HOME/光影盟-更新.command" "$DESKTOP/$name"
  chmod +x "$DESKTOP/$name"
  xattr -cr "$DESKTOP/$name" 2>/dev/null || true
done

# 再写一个极简「更新.command」，名字最短最好认
cat > "$DESKTOP/更新.command" <<EOF
#!/bin/bash
cd "$PHOTON_HOME" 2>/dev/null || true
if [[ -x "$PHOTON_HOME/光影盟-更新.command" ]]; then
  exec "$PHOTON_HOME/光影盟-更新.command"
fi
if [[ -x "$PHOTON_HOME/更新本地.sh" ]]; then
  bash "$PHOTON_HOME/更新本地.sh"
  [[ -x "$PHOTON_HOME/重建桌面更新按钮.sh" ]] && bash "$PHOTON_HOME/重建桌面更新按钮.sh" || true
  echo ""
  read -r -p "按回车关闭…" _
  exit 0
fi
echo "找不到更新脚本，请先安装到 $PHOTON_HOME"
read -r -p "按回车关闭…" _
exit 1
EOF
chmod +x "$DESKTOP/更新.command"
xattr -cr "$DESKTOP/更新.command" 2>/dev/null || true

echo ""
echo "  [完成] 桌面更新按钮已重建："
echo "    $DESKTOP/更新.command"
echo "    $DESKTOP/光影盟-更新.command"
echo "    $DESKTOP/GY-Update.command"
echo "    $DESKTOP/光影盟-更新代码.command"
echo ""
open "$DESKTOP" 2>/dev/null || true
