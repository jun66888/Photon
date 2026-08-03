#!/usr/bin/env bash
# 光影盟 · 公网隧道（学生用手机流量扫码）
# 把本机 3000 端口暴露为 https://*.trycloudflare.com，写入 gy-tunnel-origin.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"
TUNNEL_FILE="$ROOT/gy-tunnel-origin.json"
LOG_FILE="$ROOT/gy-tunnel.log"
TOOLS_DIR="$ROOT/.tools"
PID_FILE="$ROOT/gy-tunnel.pid"

mkdir -p "$TOOLS_DIR"

write_origin() {
  local origin="$1"
  origin="${origin%/}"
  [[ -z "$origin" ]] && return 1
  cat > "$TUNNEL_FILE" <<EOF
{
  "origin": "$origin",
  "updated_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "port": $PORT,
  "provider": "cloudflared",
  "note": "学生可用手机流量扫此地址；老师电脑需能上网"
}
EOF
  echo "  ★ 流量扫码地址已就绪："
  echo "    $origin"
  echo "    $origin/?mode=checkin"
}

is_tunnel_url() {
  local u="$1"
  [[ "$u" =~ ^https://[a-zA-Z0-9.-]+\.trycloudflare\.com/?$ ]] \
    || [[ "$u" =~ ^https://[a-zA-Z0-9.-]+\.loca\.lt/?$ ]] \
    || [[ "$u" =~ ^https://[a-zA-Z0-9.-]+\.ngrok(-free)?\.app/?$ ]] \
    || [[ "$u" =~ ^https://[a-zA-Z0-9.-]+\.ngrok\.io/?$ ]]
}

ensure_cloudflared() {
  if command -v cloudflared >/dev/null 2>&1; then
    echo "cloudflared"
    return 0
  fi
  local bin="$TOOLS_DIR/cloudflared"
  if [[ -x "$bin" ]]; then
    echo "$bin"
    return 0
  fi

  local os_name arch asset
  os_name="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"
  case "$os_name-$arch" in
    darwin-arm64|darwin-aarch64) asset="cloudflared-darwin-arm64.tgz" ;;
    darwin-x86_64|darwin-amd64) asset="cloudflared-darwin-amd64.tgz" ;;
    linux-x86_64|linux-amd64) asset="cloudflared-linux-amd64" ;;
    linux-aarch64|linux-arm64) asset="cloudflared-linux-arm64" ;;
    *)
      echo ""
      return 1
      ;;
  esac

  echo "  正在下载 cloudflared（首次需要一点时间）…" >&2
  local url="https://github.com/cloudflare/cloudflared/releases/latest/download/${asset}"
  local tmp="$TOOLS_DIR/cf-dl.$$"
  if ! curl -fsSL --connect-timeout 20 --max-time 180 "$url" -o "$tmp"; then
    rm -f "$tmp"
    echo ""
    return 1
  fi
  if [[ "$asset" == *.tgz ]]; then
    tar -xzf "$tmp" -C "$TOOLS_DIR" cloudflared 2>/dev/null \
      || tar -xzf "$tmp" -C "$TOOLS_DIR" 2>/dev/null || true
    rm -f "$tmp"
    if [[ -f "$TOOLS_DIR/cloudflared" ]]; then
      chmod +x "$TOOLS_DIR/cloudflared"
      echo "$TOOLS_DIR/cloudflared"
      return 0
    fi
  else
    mv -f "$tmp" "$bin"
    chmod +x "$bin"
    echo "$bin"
    return 0
  fi
  echo ""
  return 1
}

extract_url_from_line() {
  local line="$1"
  if [[ "$line" =~ (https://[a-zA-Z0-9.-]+\.trycloudflare\.com) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi
  if [[ "$line" =~ (https://[a-zA-Z0-9.-]+\.loca\.lt) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi
  if [[ "$line" =~ your\ url\ is:\ *(https://[^[:space:]]+) ]]; then
    echo "${BASH_REMATCH[1]}"
    return 0
  fi
  return 1
}

run_cloudflared() {
  local bin="$1"
  : > "$LOG_FILE"
  echo $$ > "$PID_FILE"
  echo "  正在建立公网隧道（学生可用手机流量）…"
  # cloudflared 把 URL 打在 stderr
  "$bin" tunnel --url "http://127.0.0.1:${PORT}" --no-autoupdate 2>&1 | tee -a "$LOG_FILE" | while IFS= read -r line; do
    url="$(extract_url_from_line "$line" || true)"
    if [[ -n "${url:-}" ]] && is_tunnel_url "$url"; then
      write_origin "$url" || true
    fi
  done
}

run_localtunnel() {
  if ! command -v npx >/dev/null 2>&1; then
    return 1
  fi
  : > "$LOG_FILE"
  echo $$ > "$PID_FILE"
  echo "  cloudflared 不可用，改用 localtunnel…"
  echo "  （若微信打不开，请安装 cloudflared 后重试）"
  npx --yes localtunnel --port "$PORT" 2>&1 | tee -a "$LOG_FILE" | while IFS= read -r line; do
    url="$(extract_url_from_line "$line" || true)"
    if [[ -n "${url:-}" ]]; then
      write_origin "$url" || true
    fi
  done
}

cleanup() {
  rm -f "$PID_FILE" 2>/dev/null || true
}
trap cleanup EXIT

CF_BIN="$(ensure_cloudflared || true)"
if [[ -n "${CF_BIN:-}" ]]; then
  run_cloudflared "$CF_BIN" || true
else
  run_localtunnel || {
    echo "  [错误] 无法启动公网隧道。"
    echo "  请确认老师电脑能上网，或手动安装：brew install cloudflared"
    echo '{"origin":"","error":"tunnel_unavailable","updated_at":"'"$(date -u +"%Y-%m-%dT%H:%M:%SZ")"'"}' > "$TUNNEL_FILE"
    exit 1
  }
fi
