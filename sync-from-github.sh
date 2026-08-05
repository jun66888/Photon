#!/usr/bin/env bash
# 光影盟 · 强制与 GitHub 对齐（保留课堂数据文件）
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PHOTON_BRANCH="cursor/guangyingmeng-arena-f9c7"
PHOTON_REPO="https://github.com/jun66888/Photon.git"

# 允许从任意目录调用；始终落到固定目录
ROOT="$PHOTON_HOME"
KEEP_FILES=(
  "gy-demo-db.json"
  "gy-classroom.json"
  "固定访问地址.txt"
  "gy-public-origin.json"
)

echo "----------------------------------------"
echo "同步目标：$ROOT"
echo "分支：$PHOTON_BRANCH"
echo "----------------------------------------"

if ! command -v git >/dev/null 2>&1; then
  echo "❌ 未安装 git。请先安装：xcode-select --install 或 https://git-scm.com"
  exit 1
fi

# 备份需保留的课堂数据
BACKUP_DIR=""
backup_data() {
  local src="$1"
  BACKUP_DIR="$(mktemp -d /tmp/photon-keep.XXXXXX)"
  for f in "${KEEP_FILES[@]}"; do
    if [[ -f "$src/$f" ]]; then
      cp -p "$src/$f" "$BACKUP_DIR/$f" 2>/dev/null || true
      echo "  已备份数据：$f"
    fi
  done
}
restore_data() {
  local dest="$1"
  [[ -n "$BACKUP_DIR" && -d "$BACKUP_DIR" ]] || return 0
  for f in "${KEEP_FILES[@]}"; do
    if [[ -f "$BACKUP_DIR/$f" ]]; then
      cp -p "$BACKUP_DIR/$f" "$dest/$f"
      echo "  已恢复数据：$f"
    fi
  done
  rm -rf "$BACKUP_DIR" 2>/dev/null || true
}

if [[ ! -d "$ROOT" ]]; then
  echo "目录不存在，正在克隆…"
  git clone -b "$PHOTON_BRANCH" "$PHOTON_REPO" "$ROOT"
elif [[ ! -d "$ROOT/.git" ]]; then
  echo "⚠️  目录存在但不是 git 仓库（多半是旧 zip）。将备份数据后重新克隆。"
  backup_data "$ROOT"
  STAMP="$(date +%Y%m%d%H%M)"
  mv "$ROOT" "${ROOT}-旧非git-${STAMP}"
  echo "  旧目录已移到：${ROOT}-旧非git-${STAMP}"
  git clone -b "$PHOTON_BRANCH" "$PHOTON_REPO" "$ROOT"
  restore_data "$ROOT"
else
  cd "$ROOT"
  backup_data "$ROOT"
  # 纠正远端与分支，强制对齐远程（避免 pull 冲突导致一直旧文件）
  git remote set-url origin "$PHOTON_REPO" 2>/dev/null || git remote add origin "$PHOTON_REPO"
  echo "拉取最新…"
  git fetch --force origin "$PHOTON_BRANCH"
  git checkout -B "$PHOTON_BRANCH" "origin/$PHOTON_BRANCH"
  git reset --hard "origin/$PHOTON_BRANCH"
  git clean -fd -e gy-demo-db.json -e gy-classroom.json -e '固定访问地址.txt' -e gy-public-origin.json -e node_modules -e gy-build.json
  restore_data "$ROOT"
fi

cd "$ROOT"
chmod +x \
  sync-from-github.sh start.sh 更新本地.sh 更新本地.command \
  一键放到桌面.sh 一键放到桌面.command \
  打开老师端.command 第一次安装-Mac.command \
  诊断本机.command 光影盟-更新.command \
  重建桌面更新按钮.sh 重建桌面更新按钮.command \
  重建桌面上课按钮.sh 重建桌面上课按钮.command \
  光影盟-一键上课.command 一键上课.sh 2>/dev/null || true

HEAD="$(git rev-parse --short HEAD)"
FULL="$(git rev-parse HEAD)"
WHEN="$(date '+%Y-%m-%d %H:%M:%S')"
# 给页面/服务读的版本戳
cat > "$ROOT/gy-build.json" <<EOF
{
  "commit": "$FULL",
  "short": "$HEAD",
  "branch": "$PHOTON_BRANCH",
  "synced_at": "$WHEN",
  "path": "$ROOT"
}
EOF

echo ""
echo "当前提交：$HEAD"
git log -1 --oneline
echo "目录：$(pwd)"

INDEX="$ROOT/index.html"
if [[ ! -f "$INDEX" ]]; then
  echo "❌ 缺少 index.html"
  exit 1
fi

MISS=0
grep -q "openPlayModePicker" "$INDEX" || { echo "❌ 缺少玩法弹窗"; MISS=1; }
grep -q "ICE_MODE_DEFS" "$INDEX" || { echo "❌ 缺少破冰游戏"; MISS=1; }
grep -q "破冰互动" "$INDEX" || { echo "❌ 缺少破冰入口文案"; MISS=1; }
grep -q "iceDuelStart" "$INDEX" || { echo "❌ 缺少双人对决"; MISS=1; }
grep -q "iceBuzzStart" "$INDEX" || { echo "❌ 缺少红蓝抢答"; MISS=1; }
grep -q "iceDareStart" "$INDEX" || { echo "❌ 缺少真心话冒险"; MISS=1; }
grep -q "iceSpyStart" "$INDEX" || { echo "❌ 缺少谁是卧底"; MISS=1; }
if [[ "$MISS" -ne 0 ]]; then
  echo "校验失败：文件仍不对。请把本段输出发给开发者。"
  exit 1
fi

echo "✅ 同步成功：已与 GitHub 强制对齐，课堂数据已保留"
echo "版本戳：$HEAD · $WHEN"
echo "----------------------------------------"
