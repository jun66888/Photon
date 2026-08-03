#!/usr/bin/env bash
# 光影盟 · 只重建桌面「上课 / 开始上课」按钮
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"

DESKTOP="${HOME}/Desktop"
if [[ ! -d "$DESKTOP" ]]; then
  DESKTOP="${HOME}/桌面"
fi
if [[ ! -d "$DESKTOP" ]]; then
  echo "找不到桌面文件夹：~/Desktop 或 ~/桌面"
  exit 1
fi

mkdir -p "$PHOTON_HOME"

# 保证仓库里有一键上课入口
if [[ ! -f "$PHOTON_HOME/光影盟-一键上课.command" ]]; then
  cat > "$PHOTON_HOME/光影盟-一键上课.command" <<EOF
#!/bin/bash
set -euo pipefail
PHOTON_HOME="$PHOTON_HOME"
cd "\$PHOTON_HOME" || {
  echo "找不到 \$PHOTON_HOME"
  read -r -p "按回车关闭…" _
  exit 1
}
chmod +x 一键上课.sh start.sh 2>/dev/null || true
if [[ -x "\$PHOTON_HOME/一键上课.sh" ]]; then
  exec "\$PHOTON_HOME/一键上课.sh"
fi
if [[ -x "\$PHOTON_HOME/start.sh" ]]; then
  exec "\$PHOTON_HOME/start.sh"
fi
echo "找不到上课脚本"
read -r -p "按回车关闭…" _
exit 1
EOF
fi
chmod +x "$PHOTON_HOME/光影盟-一键上课.command" 2>/dev/null || true
chmod +x "$PHOTON_HOME/一键上课.sh" 2>/dev/null || true

# 多个别名：名字尽量好认
for name in \
  "上课.command" \
  "开始上课.command" \
  "光影盟-一键上课.command" \
  "光影盟-开始上课.command" \
  "GY-Start.command" \
  "光影盟-启动环境.command"
do
  cp -f "$PHOTON_HOME/光影盟-一键上课.command" "$DESKTOP/$name"
  chmod +x "$DESKTOP/$name"
  xattr -cr "$DESKTOP/$name" 2>/dev/null || true
done

echo ""
echo "  [完成] 桌面「上课」按钮已重建："
echo "    $DESKTOP/上课.command              ← ★ 最短名，双击即开课"
echo "    $DESKTOP/开始上课.command"
echo "    $DESKTOP/光影盟-一键上课.command"
echo "    $DESKTOP/光影盟-开始上课.command"
echo "    $DESKTOP/GY-Start.command"
echo ""
echo "  说明：上面这些都是「打开/开始上课」；名字带「更新」的才是只更新。"
echo ""
open "$DESKTOP" 2>/dev/null || true
