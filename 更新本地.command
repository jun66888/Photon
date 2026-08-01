#!/bin/bash
cd "$(dirname "$0")"
echo "========================================"
echo " 光影盟 · 更新本机项目"
echo "========================================"
echo "当前目录: $(pwd)"
echo ""

if [ -d .git ]; then
  echo "检测到 git 仓库，正在拉取最新…"
  git fetch origin cursor/guangyingmeng-arena-f9c7
  git checkout cursor/guangyingmeng-arena-f9c7
  git pull origin cursor/guangyingmeng-arena-f9c7
  echo ""
  echo "最新提交："
  git log -3 --oneline
  echo ""
  echo "[完成] 请重新运行 start.sh，并在浏览器强制刷新（Cmd+Shift+R）"
else
  echo "[提示] 当前文件夹不是 git 仓库（多半是 zip 解压）。"
  echo "正在打开最新压缩包下载页…"
  echo "请下载后解压覆盖，或解压到新文件夹再用新文件夹里的 start.sh"
  open "https://github.com/jun66888/Photon/archive/refs/heads/cursor/guangyingmeng-arena-f9c7.zip"
fi

chmod +x start.sh 一键放到桌面.sh 一键放到桌面.command 更新本地.command 2>/dev/null || true
echo ""
read -r -p "按回车关闭…" _
