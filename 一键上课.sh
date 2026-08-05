#!/usr/bin/env bash
# 光影盟 · 一键上课：更新代码 → 重启服务 → 打开启动页
# 桌面只需双击这一个，不必再挨个点「更新 / 启动 / 打开老师端」
set -euo pipefail

PHOTON_HOME="/Users/liwei/Photon"
PORT=3000
HUB="http://127.0.0.1:${PORT}/launcher.html"
TEACHER="http://127.0.0.1:${PORT}/?mode=teacher"

clear 2>/dev/null || true
echo "========================================"
echo "  光影盟 · 一键上课"
echo "========================================"
echo "  将自动：更新代码 → 启动环境 → 打开启动页"
echo "  本窗口请保持开着（关掉=下课）"
echo "  目录：$PHOTON_HOME"
echo "========================================"
echo ""

if [[ ! -d "$PHOTON_HOME" ]]; then
  echo "❌ 找不到 $PHOTON_HOME"
  echo "请先运行「第一次安装-Mac.command」或「光影盟-更新」"
  read -r -p "按回车关闭…" _
  exit 1
fi

cd "$PHOTON_HOME"
chmod +x ./*.sh ./*.command 2>/dev/null || true

if ! command -v node >/dev/null 2>&1; then
  echo "❌ 未检测到 Node.js"
  echo "请先安装：https://nodejs.org （选 LTS）"
  read -r -p "按回车关闭…" _
  exit 1
fi

# 1) 更新代码（失败不阻断上课）
echo "→ [1/3] 正在更新最新代码…"
if [[ "${PHOTON_SKIP_SYNC:-0}" != "1" ]]; then
  if [[ -x "$PHOTON_HOME/sync-from-github.sh" ]]; then
    bash "$PHOTON_HOME/sync-from-github.sh" || echo "  [警告] 同步失败，继续用本地版本上课"
  elif [[ -x "$PHOTON_HOME/更新本地.sh" ]]; then
    # 更新本地会再刷桌面，稍慢但更稳
    bash "$PHOTON_HOME/更新本地.sh" || echo "  [警告] 更新失败，继续用本地版本上课"
  else
    echo "  [警告] 找不到同步脚本，跳过更新"
  fi
else
  echo "  已跳过同步（PHOTON_SKIP_SYNC=1）"
fi
echo ""

# 2) 释放端口，保证用的是刚更新的代码
echo "→ [2/3] 正在准备端口 ${PORT}…"
stop_port() {
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
  fi
  if [[ -z "${pids:-}" ]] && command -v fuser >/dev/null 2>&1; then
    pids="$(fuser -ti tcp:"$PORT" 2>/dev/null || true)"
  fi
  if [[ -n "${pids:-}" ]]; then
    echo "  发现旧服务，正在重启…"
    # shellcheck disable=SC2086
    kill $pids 2>/dev/null || true
    sleep 1
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
    sleep 1
  else
    echo "  端口空闲"
  fi
}
stop_port
echo ""

# 3) 启动后打开启动页（集成老师端/签到/隧道等按钮）
echo "→ [3/3] 启动课堂环境并打开启动页…"
echo "  启动页：$HUB"
echo "  老师端：$TEACHER"
echo ""

(
  for _i in $(seq 1 40); do
    sleep 0.5
    if curl -fsS --max-time 1 "http://127.0.0.1:${PORT}/" >/dev/null 2>&1; then
      if command -v open >/dev/null 2>&1; then
        open "$HUB" 2>/dev/null || true
        # 稍后再开老师端，方便直接上课；启动页仍留着可切回
        sleep 1.2
        open "$TEACHER" 2>/dev/null || true
      elif command -v xdg-open >/dev/null 2>&1; then
        xdg-open "$HUB" >/dev/null 2>&1 || true
        sleep 1.2
        xdg-open "$TEACHER" >/dev/null 2>&1 || true
      fi
      break
    fi
  done
) &

# 已经在本脚本里同步过，避免 start.sh 再同步一遍
export PHOTON_SKIP_SYNC=1
# 告诉 start.sh 不要再自己弹浏览器（由上面统一打开）
export PHOTON_NO_BROWSER=1
exec "$PHOTON_HOME/start.sh"
