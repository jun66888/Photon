#!/usr/bin/env bash
# 光影盟 · 一键修复/更新（无 git 也会自动备份并重装）
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"
KEEP_FILES=(
  "gy-demo-db.json"
  "gy-classroom.json"
  "固定访问地址.txt"
  "gy-public-origin.json"
)

echo "========================================"
echo "固定目录：$PHOTON_HOME"
echo "========================================"

if ! command -v git >/dev/null 2>&1; then
  echo "❌ 未安装 git。请先执行：xcode-select --install"
  exit 1
fi

BACKUP_DIR="$(mktemp -d /tmp/photon-keep.XXXXXX)"
backup_data() {
  local src="$1"
  for f in "${KEEP_FILES[@]}"; do
    if [[ -f "$src/$f" ]]; then
      cp -p "$src/$f" "$BACKUP_DIR/$f" || true
      echo "  已备份：$f"
    fi
  done
}
restore_data() {
  local dest="$1"
  for f in "${KEEP_FILES[@]}"; do
    if [[ -f "$BACKUP_DIR/$f" ]]; then
      cp -p "$BACKUP_DIR/$f" "$dest/$f"
      echo "  已恢复：$f"
    fi
  done
}

if [[ -d "$PHOTON_HOME/.git" ]]; then
  echo "检测到 git 仓库，强制同步…"
  if [[ -x "$PHOTON_HOME/sync-from-github.sh" ]]; then
    bash "$PHOTON_HOME/sync-from-github.sh"
  else
    cd "$PHOTON_HOME"
    backup_data "$PHOTON_HOME"
    git remote set-url origin "$PHOTON_REPO" 2>/dev/null || git remote add origin "$PHOTON_REPO"
    git fetch --force origin "$PHOTON_BRANCH"
    git checkout -B "$PHOTON_BRANCH" "origin/$PHOTON_BRANCH"
    git reset --hard "origin/$PHOTON_BRANCH"
    restore_data "$PHOTON_HOME"
  fi
else
  echo "⚠️  不是 git 仓库（zip 解压会导致无法更新）。"
  echo "正在自动备份课堂数据并重新克隆…"
  if [[ -d "$PHOTON_HOME" ]]; then
    backup_data "$PHOTON_HOME"
    STAMP="$(date +%Y%m%d%H%M)"
    mv "$PHOTON_HOME" "${PHOTON_HOME}-旧备份-${STAMP}"
    echo "  旧目录已移到：${PHOTON_HOME}-旧备份-${STAMP}"
  fi
  git clone -b "$PHOTON_BRANCH" "$PHOTON_REPO" "$PHOTON_HOME"
  restore_data "$PHOTON_HOME"
fi

cd "$PHOTON_HOME"
chmod +x sync-from-github.sh start.sh 一键上课.sh 更新本地.sh 更新本地.command \
  一键放到桌面.sh 一键放到桌面.command 诊断本机.command \
  光影盟-一键上课.command 光影盟-启动环境.command 打开老师端.command 2>/dev/null || true

# 写版本戳
HEAD="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"
WHEN="$(date '+%Y-%m-%d %H:%M:%S')"
cat > gy-build.json <<EOF
{
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo "")",
  "short": "$HEAD",
  "branch": "$PHOTON_BRANCH",
  "synced_at": "$WHEN",
  "path": "$PHOTON_HOME"
}
EOF

echo ""
echo "当前提交：$HEAD"
git log -1 --oneline || true

if grep -q "ICE_MODE_DEFS" index.html && grep -q "openPlayModePicker" index.html; then
  echo "✅ 修复成功：已是 git 仓库，且包含玩法/破冰功能"
else
  echo "❌ 校验失败，请把上方输出发给开发者"
  exit 1
fi

rm -rf "$BACKUP_DIR" 2>/dev/null || true

# 自动把「更新」等按钮刷到桌面
if [[ -x ./一键放到桌面.sh ]]; then
  ./一键放到桌面.sh || true
fi

echo ""
echo "桌面已有「光影盟-更新」按钮，以后双击即可更新。"
echo "现在也可执行：./start.sh"
