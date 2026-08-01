#!/usr/bin/env bash
set -euo pipefail

# 本机固定目录（用户 liwei）
EXPECTED="/Users/liwei/Photon"
ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "========================================"
echo "当前脚本所在目录："
echo "  $ROOT"
echo "期望固定目录："
echo "  $EXPECTED"
echo "========================================"

if [[ "$ROOT" != "$EXPECTED" ]]; then
  echo ""
  echo "⚠️  你不在固定目录里。"
  if [[ -d "$EXPECTED/.git" ]]; then
    echo "自动转到：$EXPECTED"
    cd "$EXPECTED"
    ROOT="$EXPECTED"
  else
    echo "请先把项目放到 $EXPECTED ，例如："
    echo "  git clone -b cursor/guangyingmeng-arena-f9c7 https://github.com/jun66888/Photon.git /Users/liwei/Photon"
    exit 1
  fi
fi

cd "$ROOT"
INDEX="$ROOT/index.html"

if [[ ! -d .git ]]; then
  echo "❌ $ROOT 不是 git 仓库。"
  echo "请重新克隆到固定目录（会覆盖旧文件夹前请先备份需要的数据）："
  echo "  mv /Users/liwei/Photon /Users/liwei/Photon-旧备份-\$(date +%Y%m%d)"
  echo "  git clone -b cursor/guangyingmeng-arena-f9c7 https://github.com/jun66888/Photon.git /Users/liwei/Photon"
  exit 1
fi

git fetch origin cursor/guangyingmeng-arena-f9c7
git checkout cursor/guangyingmeng-arena-f9c7
git pull origin cursor/guangyingmeng-arena-f9c7
chmod +x start.sh 更新本地.sh 更新本地.command 一键放到桌面.sh 一键放到桌面.command 2>/dev/null || true

echo ""
echo "最近提交："
git log -3 --oneline
echo ""
echo "当前 HEAD：$(git rev-parse --short HEAD)"
echo "index.html：$INDEX"

if grep -q "settings-play-top" "$INDEX" && grep -q "PLAY_MODE_DEFS" "$INDEX" && grep -q "goto-play-mode" "$INDEX"; then
  echo "✅ 校验通过：已包含玩法模式（置顶 + 侧栏入口）"
else
  echo "❌ 校验失败：index.html 仍是旧版"
  exit 1
fi

echo ""
echo "下一步："
echo "  1) ./start.sh"
echo "  2) 浏览器打开 http://127.0.0.1:3000/?mode=teacher"
echo "  3) Cmd+Shift+R 强刷，点侧栏「玩法」"
echo "  4) 可选：./一键放到桌面.sh  （让桌面快捷方式指向本目录）"
