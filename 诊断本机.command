#!/bin/bash
PHOTON_HOME="/Users/liwei/Photon"
echo "======== 光影盟本机诊断 ========"
echo "期望目录：$PHOTON_HOME"
echo "脚本所在：$(cd "$(dirname "$0")" && pwd)"
echo ""
if [[ -d "$PHOTON_HOME" ]]; then
  echo "✅ 固定目录存在"
  cd "$PHOTON_HOME"
  echo "实际路径：$(pwd)"
  if [[ -d .git ]]; then
    echo "✅ 是 git 仓库"
    echo "分支：$(git branch --show-current 2>/dev/null)"
    echo "HEAD：$(git log -1 --oneline 2>/dev/null)"
    echo "远端：$(git remote get-url origin 2>/dev/null)"
  else
    echo "❌ 不是 git 仓库（zip 解压会导致每次都要覆盖）"
  fi
  echo ""
  echo "特征检测："
  for key in openPlayModePicker ICE_MODE_DEFS 破冰互动 iceDuelStart iceBuzzStart iceDareStart iceSpyStart 十个小游戏; do
    if grep -q "$key" index.html 2>/dev/null; then echo "  ✅ $key"; else echo "  ❌ 缺少 $key"; fi
  done
  if [[ -f gy-build.json ]]; then
    echo ""
    echo "gy-build.json："
    cat gy-build.json
  fi
else
  echo "❌ 找不到 $PHOTON_HOME"
fi
echo ""
echo "桌面快捷方式（若存在）应指向 $PHOTON_HOME"
echo "=============================="
read -r -p "按回车关闭…" _
