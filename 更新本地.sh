#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [ -d .git ]; then
  git fetch origin cursor/guangyingmeng-arena-f9c7
  git checkout cursor/guangyingmeng-arena-f9c7
  git pull origin cursor/guangyingmeng-arena-f9c7
  git log -3 --oneline
  echo "完成。请重新 ./start.sh，浏览器 Cmd+Shift+R 强刷。"
else
  echo "不是 git 仓库。请重新下载："
  echo "https://github.com/jun66888/Photon/archive/refs/heads/cursor/guangyingmeng-arena-f9c7.zip"
  if command -v open >/dev/null; then
    open "https://github.com/jun66888/Photon/archive/refs/heads/cursor/guangyingmeng-arena-f9c7.zip"
  fi
fi
