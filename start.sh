#!/usr/bin/env bash
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
# 始终在固定目录启动，避免开错副本
if [[ -d "$PHOTON_HOME" ]]; then
  ROOT="$PHOTON_HOME"
else
  ROOT="$(cd "$(dirname "$0")" && pwd)"
fi
cd "$ROOT"

echo ""
echo "  ========================================"
echo "   光影盟 · 本机离线课堂"
echo "   启动前自动同步 GitHub"
echo "  ========================================"
echo ""
echo "  程序目录：$ROOT"

# 每次上课自动同步（可用 PHOTON_SKIP_SYNC=1 跳过）
if [[ "${PHOTON_SKIP_SYNC:-0}" != "1" ]]; then
  if [[ -x "$ROOT/sync-from-github.sh" ]]; then
    echo "  正在同步最新代码…"
    if bash "$ROOT/sync-from-github.sh"; then
      echo "  同步完成"
    else
      echo "  [警告] 同步失败，将用当前本地文件启动（可检查网络后重试）"
    fi
  elif [[ -d "$ROOT/.git" ]]; then
    echo "  正在 git 拉取…"
    git fetch --force origin cursor/guangyingmeng-arena-f9c7 2>/dev/null || true
    git checkout -B cursor/guangyingmeng-arena-f9c7 origin/cursor/guangyingmeng-arena-f9c7 2>/dev/null || true
    git reset --hard origin/cursor/guangyingmeng-arena-f9c7 2>/dev/null || true
  else
    echo "  [警告] 无法自动同步：目录不是 git 仓库"
    echo "         请运行：更新本地.sh 或重新克隆到 $PHOTON_HOME"
  fi
  echo ""
fi

echo "  主文件：$ROOT/index.html"
if [[ -f "$ROOT/gy-build.json" ]]; then
  echo "  版本：$(grep -o '"short": "[^"]*"' "$ROOT/gy-build.json" | head -1 | cut -d'"' -f4) · $(grep -o '"synced_at": "[^"]*"' "$ROOT/gy-build.json" | head -1 | cut -d'"' -f4)"
fi

if ! grep -q "ICE_MODE_DEFS" "$ROOT/index.html" 2>/dev/null; then
  echo "  [错误] index.html 仍是旧版（没有破冰游戏）"
  echo "         请有网时再运行一次本脚本，或执行：./更新本地.sh"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "  [错误] 未检测到 Node.js"
  echo "  请先在有网时安装一次：https://nodejs.org （选 LTS）"
  exit 1
fi

echo "  【请收藏老师端 · 永远不变】"
echo "    http://127.0.0.1:3000/?mode=teacher"
echo ""

TUNNEL_PID=""
cleanup_tunnel() {
  if [[ -n "${TUNNEL_PID:-}" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
  fi
  # 顺带清掉可能残留的 tunnel 子进程
  if [[ -f "$ROOT/gy-tunnel.pid" ]]; then
    tp="$(cat "$ROOT/gy-tunnel.pid" 2>/dev/null || true)"
    [[ -n "${tp:-}" ]] && kill "$tp" 2>/dev/null || true
    rm -f "$ROOT/gy-tunnel.pid" 2>/dev/null || true
  fi
}
trap cleanup_tunnel EXIT INT TERM

# 默认开启公网隧道，让学生用手机流量也能扫签到码（老师电脑需能上网）
# 只要局域网：GY_PUBLIC_TUNNEL=0 ./start.sh
if [[ "${GY_PUBLIC_TUNNEL:-1}" == "1" ]]; then
  chmod +x "$ROOT/public-tunnel.sh" 2>/dev/null || true
  if [[ -x "$ROOT/public-tunnel.sh" ]]; then
    echo "  正在启动流量扫码隧道（学生可不用教室 Wi‑Fi）…"
    bash "$ROOT/public-tunnel.sh" &
    TUNNEL_PID=$!
    echo "  隧道进程 PID=$TUNNEL_PID（就绪后签到页二维码会自动换成 https 地址）"
    echo ""
  else
    echo "  [警告] 缺少 public-tunnel.sh，学生可能只能连同一 Wi‑Fi 扫码"
    echo ""
  fi
else
  echo "  已关闭公网隧道（GY_PUBLIC_TUNNEL=0）· 仅局域网扫码"
  echo ""
fi

(
  sleep 2
  url="http://127.0.0.1:3000/?mode=teacher"
  if command -v xdg-open >/dev/null 2>&1; then xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then open "$url" >/dev/null 2>&1 || true
  fi
) &

# 隧道地址出现后提示一次
(
  for _i in $(seq 1 40); do
    sleep 1
    if [[ -f "$ROOT/gy-tunnel-origin.json" ]]; then
      origin="$(grep -o '"origin": "[^"]*"' "$ROOT/gy-tunnel-origin.json" 2>/dev/null | head -1 | cut -d'"' -f4 || true)"
      if [[ -n "${origin:-}" && "$origin" == https://* ]]; then
        echo ""
        echo "  ========================================"
        echo "  ★ 学生可用手机流量扫码："
        echo "    ${origin}/?mode=checkin"
        echo "  ========================================"
        echo ""
        break
      fi
    fi
  done
) &

while true; do
  node server.mjs && break
  code=$?
  echo ""
  echo "  [提示] 服务退出（代码 $code），3 秒后自动重启…"
  sleep 3
done
