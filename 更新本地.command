#!/bin/bash
cd "$(dirname "$0")"
echo "更新本机项目: $(pwd)"
if [ ! -d .git ]; then
  echo ""
  echo "这个文件夹不是 git 仓库（zip 解压的）。"
  echo "请改用「第一次安装」：把项目装到 ~/Photon，以后就不用反复下载。"
  echo ""
  echo "终端复制运行："
  echo "  git clone -b cursor/guangyingmeng-arena-f9c7 https://github.com/jun66888/Photon.git ~/Photon"
  echo "  cd ~/Photon && chmod +x start.sh 更新本地.command && ./一键放到桌面.sh"
  echo ""
  open "https://github.com/jun66888/Photon"
  read -r -p "按回车关闭…" _
  exit 1
fi
git fetch origin cursor/guangyingmeng-arena-f9c7
git checkout cursor/guangyingmeng-arena-f9c7
git pull origin cursor/guangyingmeng-arena-f9c7
chmod +x start.sh 更新本地.command 一键放到桌面.command 2>/dev/null || true
echo ""
echo "最新提交："
git log -3 --oneline
echo ""
echo "[完成] 请重新 ./start.sh，浏览器 Cmd+Shift+R 强刷"
read -r -p "按回车关闭…" _
