#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "========================================"
echo "本机项目目录："
echo "  $ROOT"
echo "本机 index.html："
echo "  $ROOT/index.html"
echo "========================================"

if [ -d .git ]; then
  git fetch origin cursor/guangyingmeng-arena-f9c7
  git checkout cursor/guangyingmeng-arena-f9c7
  git pull origin cursor/guangyingmeng-arena-f9c7
  echo ""
  echo "最近提交："
  git log -3 --oneline
else
  echo "不是 git 仓库。请重新下载并解压到新目录（不要继续用旧文件夹）："
  echo "https://github.com/jun66888/Photon/archive/refs/heads/cursor/guangyingmeng-arena-f9c7.zip"
  if command -v open >/dev/null; then
    open "https://github.com/jun66888/Photon/archive/refs/heads/cursor/guangyingmeng-arena-f9c7.zip"
  fi
  exit 1
fi

echo ""
if grep -q "settings-play-top" "$ROOT/index.html" && grep -q "PLAY_MODE_DEFS" "$ROOT/index.html"; then
  echo "✅ 校验通过：index.html 已包含「玩法模式」"
else
  echo "❌ 校验失败：当前 index.html 仍是旧版（没有玩法模式）"
  echo "   请确认你启动的是上面打印的这个目录，而不是 Downloads / 桌面旧副本。"
  exit 1
fi

echo ""
echo "请执行：./start.sh"
echo "浏览器打开 http://127.0.0.1:3000/?mode=teacher 后 Cmd+Shift+R 强刷"
echo "侧栏点「玩法」或「设置」——页面最上方应是三档玩法卡片。"
