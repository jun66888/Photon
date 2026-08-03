#!/bin/bash
# 光影盟 · 桌面「更新」按钮（自包含：无 git / 旧 zip 也能修好）
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

clear 2>/dev/null || true
echo "========================================"
echo "  光影盟 · 更新到最新"
echo "  目录：$PHOTON_HOME"
echo "========================================"
echo ""

if ! command -v git >/dev/null 2>&1; then
  echo "❌ 未安装 git。请先执行：xcode-select --install"
  read -r -p "按回车关闭…" _
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
  echo "→ 强制同步 GitHub…"
  cd "$PHOTON_HOME"
  # 优先走仓库内一键更新（会写版本戳 + 刷桌面按钮）
  if [[ -x ./更新本地.sh ]]; then
    bash ./更新本地.sh || true
  else
    git remote set-url origin "$PHOTON_REPO" 2>/dev/null || git remote add origin "$PHOTON_REPO"
    git fetch --force origin "$PHOTON_BRANCH"
    git checkout -B "$PHOTON_BRANCH" "origin/$PHOTON_BRANCH"
    git reset --hard "origin/$PHOTON_BRANCH"
  fi
else
  echo "→ 当前不是 git 仓库，自动备份并重新克隆…"
  if [[ -d "$PHOTON_HOME" ]]; then
    backup_data "$PHOTON_HOME"
    STAMP="$(date +%Y%m%d%H%M)"
    mv "$PHOTON_HOME" "${PHOTON_HOME}-旧备份-${STAMP}"
    echo "  旧目录：${PHOTON_HOME}-旧备份-${STAMP}"
  fi
  git clone -b "$PHOTON_BRANCH" "$PHOTON_REPO" "$PHOTON_HOME"
  restore_data "$PHOTON_HOME"
fi

cd "$PHOTON_HOME"
chmod +x *.sh *.command 2>/dev/null || true
restore_data "$PHOTON_HOME" 2>/dev/null || true

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

# 无论刚才是否已刷过，再强制重建桌面「更新」按钮
if [[ -x ./一键放到桌面.sh ]]; then
  bash ./一键放到桌面.sh || true
elif [[ -x ./重建桌面更新按钮.sh ]]; then
  bash ./重建桌面更新按钮.sh || true
fi

echo ""
echo "✅ 更新完成"
echo "   版本：$HEAD"
git log -1 --oneline 2>/dev/null || true
echo ""
echo "桌面应有：光影盟-更新.command / GY-Update.command"
echo "接下来可双击「光影盟-一键上课」，或按 y 立即启动。"
echo ""
read -r -p "现在启动上课吗？[y/N] " ans
if [[ "${ans:-}" == "y" || "${ans:-}" == "Y" ]]; then
  exec ./start.sh
fi
read -r -p "按回车关闭…" _
