#!/usr/bin/env bash
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"
ROOT="$PHOTON_HOME"
INDEX="$PHOTON_HOME/index.html"

echo "========================================"
echo "固定目录："
echo "  $PHOTON_HOME"
echo "主文件："
echo "  $INDEX"
echo "========================================"

if [[ ! -d "$PHOTON_HOME" ]]; then
  echo "目录不存在，正在克隆到固定路径…"
  git clone -b "$PHOTON_BRANCH" "$PHOTON_REPO" "$PHOTON_HOME"
fi

cd "$PHOTON_HOME"

if [[ ! -d .git ]]; then
  echo "❌ $PHOTON_HOME 不是 git 仓库。"
  echo "备份并重新克隆："
  echo "  mv \"$PHOTON_HOME\" \"${PHOTON_HOME}-旧备份-\$(date +%Y%m%d)\""
  echo "  git clone -b $PHOTON_BRANCH $PHOTON_REPO $PHOTON_HOME"
  exit 1
fi

git fetch origin "$PHOTON_BRANCH"
git checkout "$PHOTON_BRANCH"
git pull origin "$PHOTON_BRANCH"
chmod +x \
  start.sh 更新本地.sh 更新本地.command \
  一键放到桌面.sh 一键放到桌面.command \
  打开老师端.command 第一次安装-Mac.command \
  2>/dev/null || true

echo ""
echo "最近提交："
git log -3 --oneline
echo ""
echo "当前 HEAD：$(git rev-parse --short HEAD)"

if grep -q "settings-play-top" "$INDEX" && grep -q "PLAY_MODE_DEFS" "$INDEX" && grep -q "goto-play-mode" "$INDEX"; then
  echo "✅ 校验通过：已包含玩法模式（置顶 + 侧栏入口）"
else
  echo "❌ 校验失败：index.html 仍是旧版"
  exit 1
fi

echo ""
echo "下一步："
echo "  1) $PHOTON_HOME/start.sh"
echo "  2) 浏览器打开 http://127.0.0.1:3000/?mode=teacher"
echo "  3) Cmd+Shift+R 强刷，点侧栏「玩法」"
echo "  4) 可选：$PHOTON_HOME/一键放到桌面.sh"
