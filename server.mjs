#!/usr/bin/env node
/**
 * 光影盟本地服务：静态站 + 局域网地址 + DEMO 跨设备共享库
 * 手机签到 / 老师投屏共用 /__gy/demo-db，实现实时同步（无需 Firebase）
 * 课堂资料：老师指定本机文件夹，学生经 /share.html 下载
 */
import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createWriteStream, createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
/** 端口写死 3000，老师收藏地址才不会变（勿随意改 PORT） */
const PORT = Number(process.env.PORT || 3000) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DEMO_DB_FILE = path.join(ROOT, "gy-demo-db.json");
const CLASSROOM_FILE = path.join(ROOT, "gy-classroom.json");
const TUNNEL_FILE = path.join(ROOT, "gy-tunnel-origin.json");
const SHARE_CFG_FILE = path.join(ROOT, "gy-share-folder.json");
const DEFAULT_SHARE_DIR = path.join(ROOT, "课堂资料");
const ACCESS_FILE = path.join(ROOT, "固定访问地址.txt");
/** 老师端永久收藏地址（本机环回，永远不变） */
const TEACHER_BOOKMARK = `http://127.0.0.1:${PORT}/?mode=teacher`;
const STUDENT_BOOKMARK_PATH = `/?mode=student`;
const SHARE_PAGE_PATH = "/share.html";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".bat": "text/plain; charset=utf-8",
  ".sh": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".7z": "application/x-7z-compressed",
  ".rar": "application/vnd.rar",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".csv": "text/csv; charset=utf-8"
};

function isPhoneUnfriendlyIp(ip) {
  const h = String(ip || "").toLowerCase();
  if (!h || h === "127.0.0.1" || h === "0.0.0.0") return true;
  if (h.startsWith("169.254.")) return true;
  // Docker 默认桥、常见 compose、Cloud Agent 内网——手机扫不开
  if (h.startsWith("172.17.") || h.startsWith("172.18.") || h.startsWith("172.19.")) return true;
  if (h.startsWith("172.30.") || h.startsWith("172.31.")) return true;
  return false;
}

function lanIPv4List() {
  const nets = os.networkInterfaces();
  const out = [];
  for (const name of Object.keys(nets || {})) {
    for (const net of nets[name] || []) {
      const fam = net.family;
      if ((fam === "IPv4" || fam === 4) && !net.internal) {
        out.push({ address: net.address, name });
      }
    }
  }
  const score = (ip) => {
    if (ip.startsWith("192.168.")) return 0;
    if (ip.startsWith("10.")) return 1;
    if (isPhoneUnfriendlyIp(ip)) return 8;
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return 2;
    return 9;
  };
  out.sort((a, b) => score(a.address) - score(b.address));
  return out;
}

function normalizeOrigin(raw) {
  return String(raw || "").trim().replace(/\/$/, "");
}

function isClassroomLanHost(host) {
  const h = String(host || "").toLowerCase();
  if (!h || isPhoneUnfriendlyIp(h)) return false;
  return h.startsWith("192.168.") || h.startsWith("10.") || /^172\.(1[6-9]|2\d|3[0-1])\./.test(h);
}

function isPublicTunnelHost(host) {
  const h = String(host || "").toLowerCase();
  return h.includes("trycloudflare.com") || h.includes("cfargotunnel.com")
    || h.includes("ngrok") || h.includes("loca.lt") || h.includes("lhr.life")
    || h.includes("cloudflared") || h.endsWith(".ts.net");
}

/** 学生手机流量可达：公网隧道 https；同 Wi‑Fi：局域网 http */
function isPhoneReachableOrigin(url) {
  try {
    const u = new URL(String(url || ""));
    const host = u.hostname.toLowerCase();
    if (isPhoneUnfriendlyIp(host)) return false;
    if (isPublicTunnelHost(host) && (u.protocol === "https:" || u.protocol === "http:")) return true;
    if (u.protocol === "http:" && isClassroomLanHost(host)) return true;
    return false;
  } catch (e) {
    return false;
  }
}

let liveTunnelOrigin = "";
let liveTunnelProvider = "";
let tunnelProc = null;
let tunnelStatus = { state: "idle", detail: "", updated_at: "" };
let tunnelFailStreak = 0;
let tunnelHeartbeatTimer = null;
let lastTunnelRestartAt = 0;
const TOOLS_DIR = path.join(ROOT, ".tools");
const TUNNEL_LOG = path.join(ROOT, "gy-tunnel.log");
/** 最短重启间隔，避免二维码地址狂跳 */
const TUNNEL_RESTART_COOLDOWN_MS = 45000;

function clearTunnelOriginFile() {
  try { if (fs.existsSync(TUNNEL_FILE)) fs.unlinkSync(TUNNEL_FILE); } catch (e) { /* ignore */ }
}

function loadTunnelOrigin() {
  // 只信任当前仍存活的隧道进程；进程已死后绝不回读旧文件（否则二维码扫了「链接不上」）
  if (liveTunnelOrigin && isPhoneReachableOrigin(liveTunnelOrigin) && tunnelProc) {
    return liveTunnelOrigin;
  }
  if (!tunnelProc) {
    if (liveTunnelOrigin) liveTunnelOrigin = "";
    return "";
  }
  return liveTunnelOrigin && isPhoneReachableOrigin(liveTunnelOrigin) ? liveTunnelOrigin : "";
}

function probeTunnelHealth(origin) {
  const o = normalizeOrigin(origin);
  if (!o) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const done = (ok) => {
      if (settled) return;
      settled = true;
      resolve(!!ok);
    };
    try {
      const u = new URL(o + "/__gy/health");
      const lib = u.protocol === "https:" ? https : http;
      const req = lib.get(u, {
        headers: { "User-Agent": "guangyingmeng-tunnel-probe" },
        timeout: 10000
      }, (res) => {
        const code = res.statusCode || 0;
        res.resume();
        done(code >= 200 && code < 500);
      });
      req.on("error", () => done(false));
      req.on("timeout", () => { try { req.destroy(); } catch (e) { /* ignore */ } done(false); });
      setTimeout(() => done(false), 11000);
    } catch (e) {
      done(false);
    }
  });
}

async function probeTunnelHealthRetry(origin, tries = 5, gapMs = 2500) {
  for (let i = 0; i < tries; i++) {
    if (await probeTunnelHealth(origin)) return true;
    if (i < tries - 1) await new Promise((r) => setTimeout(r, gapMs));
  }
  return false;
}

function stopTunnelHeartbeat() {
  if (tunnelHeartbeatTimer) {
    clearInterval(tunnelHeartbeatTimer);
    tunnelHeartbeatTimer = null;
  }
}

function scheduleTunnelRestart(reason, { forceLt = false, fromExit = false } = {}) {
  const now = Date.now();
  const since = now - lastTunnelRestartAt;
  // 进程还在且处于冷却期：只标波动，不杀进程（避免二维码地址狂跳）
  if (!fromExit && tunnelProc && since < TUNNEL_RESTART_COOLDOWN_MS) {
    tunnelStatus = {
      state: "degraded",
      detail: "隧道波动中，暂缓重建以避免二维码乱跳 · " + String(reason || "").slice(0, 80),
      updated_at: new Date().toISOString()
    };
    return;
  }
  const delay = fromExit
    ? Math.max(1500, TUNNEL_RESTART_COOLDOWN_MS - since)
    : 1200;
  lastTunnelRestartAt = now;
  stopTunnelHeartbeat();
  if (forceLt) preferLocaltunnelNext = true;
  if (tunnelProc) {
    suppressTunnelRestart = true;
    try { tunnelProc.kill(); } catch (e) { /* ignore */ }
    tunnelProc = null;
  }
  liveTunnelOrigin = "";
  liveTunnelProvider = "";
  clearTunnelOriginFile();
  tunnelStatus = {
    state: "restarting",
    detail: "正在重建公网隧道… " + String(reason || "").slice(0, 100),
    updated_at: new Date().toISOString()
  };
  if (tunnelRestartTimer) clearTimeout(tunnelRestartTimer);
  tunnelRestartTimer = setTimeout(() => startPublicTunnel(), delay);
}

function startTunnelHeartbeat() {
  stopTunnelHeartbeat();
  tunnelFailStreak = 0;
  tunnelHeartbeatTimer = setInterval(async () => {
    const o = loadTunnelOrigin();
    if (!o || !tunnelProc) return;
    const ok = await probeTunnelHealth(o);
    if (ok) {
      tunnelFailStreak = 0;
      if (tunnelStatus.state === "degraded" || tunnelStatus.state === "probing") {
        tunnelStatus = { state: "ready", detail: o, updated_at: new Date().toISOString() };
        try { writeOriginHint(); } catch (e) { /* ignore */ }
      }
      return;
    }
    tunnelFailStreak += 1;
    tunnelStatus = {
      state: "degraded",
      detail: `公网波动（${tunnelFailStreak}/4）· 仍保持当前地址，请稍候再扫：` + o,
      updated_at: new Date().toISOString()
    };
    // 连续失败才重建，避免一次探测失败就换新 URL
    if (tunnelFailStreak >= 4) {
      console.log("  [警告] 隧道连续探测失败，准备重建：" + o);
      scheduleTunnelRestart("连续探测失败", { forceLt: liveTunnelProvider === "cloudflared" });
    }
  }, 20000);
}

function saveTunnelOrigin(origin, provider = "cloudflared") {
  const o = normalizeOrigin(origin);
  if (!o || !isPublicTunnelHost(new URL(o).hostname)) return "";
  // 同一地址重复上报：不打断
  if (liveTunnelOrigin === o && (tunnelStatus.state === "ready" || tunnelStatus.state === "probing" || tunnelStatus.state === "degraded")) {
    return o;
  }
  liveTunnelOrigin = o;
  liveTunnelProvider = provider;
  tunnelFailStreak = 0;
  // Cloudflare 提示「可能要一会儿才可达」——先标记可用并展示，后台慢慢确认
  tunnelStatus = { state: "ready", detail: o, updated_at: new Date().toISOString() };
  try {
    fs.writeFileSync(TUNNEL_FILE, JSON.stringify({
      origin: o,
      updated_at: new Date().toISOString(),
      port: PORT,
      provider,
      note: "学生可用手机流量扫此地址；老师电脑需能上网"
    }, null, 2), "utf8");
  } catch (e) { /* ignore */ }
  console.log("");
  console.log("  ========================================");
  console.log("  ★ 学生可用手机流量扫码：");
  console.log("    " + o + "/?mode=checkin");
  console.log("  ========================================");
  console.log("");
  try { writeOriginHint(); } catch (e) { /* ignore */ }
  startTunnelHeartbeat();
  // 延后多次探测；失败只标 degraded，不立刻杀隧道（二维码保持不变）
  setTimeout(() => {
    probeTunnelHealthRetry(o, 6, 3000).then((ok) => {
      if (liveTunnelOrigin !== o) return;
      if (ok) {
        tunnelFailStreak = 0;
        tunnelStatus = { state: "ready", detail: o, updated_at: new Date().toISOString() };
        try { writeOriginHint(); } catch (e) { /* ignore */ }
        return;
      }
      console.log("  [警告] 新隧道初期探测未通过，先保留地址观察：" + o);
      tunnelStatus = {
        state: "degraded",
        detail: "地址已生成但连通偏慢，请稍等 10–20 秒再扫：" + o,
        updated_at: new Date().toISOString()
      };
    });
  }, 4000);
  return o;
}

function extractTunnelUrl(text) {
  // 去掉 ANSI 颜色码，避免解析失败
  const s = String(text || "").replace(/\x1b\[[0-9;]*m/g, "");
  const m = s.match(/https:\/\/[a-zA-Z0-9._-]+\.trycloudflare\.com/)
    || s.match(/https:\/\/[a-zA-Z0-9._-]+\.cfargotunnel\.com/)
    || s.match(/https:\/\/[a-zA-Z0-9._-]+\.loca\.lt/)
    || s.match(/https:\/\/[a-zA-Z0-9._-]+\.ngrok(?:-free)?\.app/)
    || s.match(/https:\/\/[a-zA-Z0-9._-]+\.ngrok\.io/)
    || s.match(/https:\/\/[a-zA-Z0-9._-]+\.lhr\.life/);
  return m ? m[0] : "";
}

function downloadFile(url, dest, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 8) return reject(new Error("too many redirects"));
    const lib = url.startsWith("https") ? https : http;
    const req = lib.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 guangyingmeng-tunnel" }
    }, async (res) => {
      const code = res.statusCode || 0;
      if (code >= 300 && code < 400 && res.headers.location) {
        res.resume();
        try {
          resolve(await downloadFile(res.headers.location, dest, redirects + 1));
        } catch (e) { reject(e); }
        return;
      }
      if (code !== 200) {
        res.resume();
        reject(new Error("download HTTP " + code + " from " + url));
        return;
      }
      try {
        await pipeline(res, createWriteStream(dest));
        resolve(dest);
      } catch (e) { reject(e); }
    });
    req.on("error", reject);
    req.setTimeout(120000, () => { req.destroy(new Error("download timeout")); });
  });
}

function cloudflaredAssetName() {
  const plat = process.platform;
  const arch = process.arch;
  if (plat === "darwin" && arch === "arm64") return { asset: "cloudflared-darwin-arm64.tgz", tgz: true };
  if (plat === "darwin" && (arch === "x64" || arch === "amd64")) return { asset: "cloudflared-darwin-amd64.tgz", tgz: true };
  if (plat === "linux" && arch === "arm64") return { asset: "cloudflared-linux-arm64", tgz: false };
  if (plat === "linux") return { asset: "cloudflared-linux-amd64", tgz: false };
  if (plat === "win32") return { asset: "cloudflared-windows-amd64.exe", tgz: false };
  return null;
}

function lookLikeCloudflaredBin(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return false;
    const st = fs.statSync(filePath);
    if (!st.isFile() || st.size < 100000) return false;
    execFileSync(filePath, ["--version"], { stdio: "ignore", timeout: 8000 });
    return true;
  } catch (e) {
    return false;
  }
}

function findBrewCloudflared() {
  try {
    const p = String(execFileSync("brew", ["--prefix", "cloudflared"], { encoding: "utf8" }).trim());
    const cand = path.join(p, "bin", "cloudflared");
    if (lookLikeCloudflaredBin(cand)) return cand;
  } catch (e) { /* ignore */ }
  return "";
}

function clearMacQuarantine(filePath) {
  if (process.platform !== "darwin" || !filePath) return;
  try {
    execFileSync("xattr", ["-dr", "com.apple.quarantine", filePath], { stdio: "ignore" });
  } catch (e) { /* ignore */ }
}

async function downloadCloudflaredTo(bin, spec) {
  fs.mkdirSync(TOOLS_DIR, { recursive: true });
  const gh = "https://github.com/cloudflare/cloudflared/releases/latest/download/" + spec.asset;
  // 国内常见 GitHub 加速；依次尝试
  const urls = [
    gh,
    "https://ghfast.top/" + gh,
    "https://gh-proxy.com/" + gh,
    "https://mirror.ghproxy.com/" + gh,
    "https://gitproxy.click/" + gh
  ];
  let lastErr = null;
  for (const url of urls) {
    const tmp = path.join(TOOLS_DIR, "cf-dl-" + Date.now() + "-" + Math.random().toString(16).slice(2));
    try {
      tunnelStatus = {
        state: "downloading",
        detail: "正在下载 cloudflared… " + url.replace(/^https?:\/\//, "").slice(0, 48),
        updated_at: new Date().toISOString()
      };
      console.log("  下载 cloudflared：" + url);
      await downloadFile(url, tmp);
      if (spec.tgz) {
        execFileSync("tar", ["-xzf", tmp, "-C", TOOLS_DIR], { stdio: "ignore" });
        try { fs.unlinkSync(tmp); } catch (e) { /* ignore */ }
        if (!fs.existsSync(bin)) {
          const walk = (dir, depth = 0) => {
            if (depth > 3 || !fs.existsSync(dir)) return "";
            for (const name of fs.readdirSync(dir)) {
              const p = path.join(dir, name);
              if (name === "cloudflared" || name === "cloudflared.exe") return p;
              try {
                if (fs.statSync(p).isDirectory()) {
                  const hit = walk(p, depth + 1);
                  if (hit) return hit;
                }
              } catch (e) { /* ignore */ }
            }
            return "";
          };
          const found = walk(TOOLS_DIR);
          if (found && found !== bin) fs.copyFileSync(found, bin);
        }
      } else {
        fs.renameSync(tmp, bin);
      }
      try { fs.chmodSync(bin, 0o755); } catch (e) { /* ignore */ }
      clearMacQuarantine(bin);
      clearMacQuarantine(TOOLS_DIR);
      if (lookLikeCloudflaredBin(bin)) return bin;
      lastErr = new Error("下载完成但无法执行 cloudflared");
    } catch (e) {
      lastErr = e;
      try { fs.unlinkSync(tmp); } catch (err) { /* ignore */ }
    }
  }
  throw lastErr || new Error("cloudflared 下载失败");
}

async function ensureCloudflaredBin() {
  // 1) PATH
  try {
    execFileSync("cloudflared", ["--version"], { stdio: "ignore", timeout: 8000 });
    return "cloudflared";
  } catch (e) { /* next */ }
  // 2) brew
  const brewBin = findBrewCloudflared();
  if (brewBin) return brewBin;
  // 3) 本地缓存
  const bin = path.join(TOOLS_DIR, process.platform === "win32" ? "cloudflared.exe" : "cloudflared");
  if (lookLikeCloudflaredBin(bin)) {
    clearMacQuarantine(bin);
    return bin;
  }
  // 4) 尝试 brew 安装（Mac 常见）
  if (process.platform === "darwin") {
    try {
      tunnelStatus = { state: "downloading", detail: "正在 brew 安装 cloudflared…", updated_at: new Date().toISOString() };
      console.log("  尝试 brew install cloudflared …");
      execFileSync("brew", ["install", "cloudflared"], { stdio: "ignore", timeout: 300000 });
      const again = findBrewCloudflared();
      if (again) return again;
      execFileSync("cloudflared", ["--version"], { stdio: "ignore", timeout: 8000 });
      return "cloudflared";
    } catch (e) { /* fall through to download */ }
  }
  const spec = cloudflaredAssetName();
  if (!spec) throw new Error("当前系统暂不支持自动下载 cloudflared");
  return downloadCloudflaredTo(bin, spec);
}

let tunnelRestartTimer = null;
let tunnelBootAttempt = 0;
let preferLocaltunnelNext = false;
let suppressTunnelRestart = false;

function commandExists(cmd) {
  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [cmd], { stdio: "ignore" });
    return true;
  } catch (e) {
    return false;
  }
}

function attachTunnelIO(child, provider) {
  const onChunk = (buf) => {
    const text = buf.toString("utf8");
    try { fs.appendFileSync(TUNNEL_LOG, text); } catch (e) { /* ignore */ }
    // localtunnel 常见输出：your url is: https://xxx.loca.lt
    const url = extractTunnelUrl(text);
    if (url) saveTunnelOrigin(url, provider);
  };
  child.stdout.on("data", onChunk);
  child.stderr.on("data", onChunk);
  child.on("error", (err) => {
    tunnelStatus = {
      state: "error",
      detail: "隧道进程启动失败：" + String(err.message || err),
      updated_at: new Date().toISOString()
    };
    console.log("  [错误] " + tunnelStatus.detail);
  });
  child.on("exit", (code) => {
    const skip = suppressTunnelRestart;
    suppressTunnelRestart = false;
    stopTunnelHeartbeat();
    tunnelProc = null;
    const oldOrigin = liveTunnelOrigin;
    liveTunnelOrigin = "";
    liveTunnelProvider = "";
    clearTunnelOriginFile();
    try { writeOriginHint(); } catch (e) { /* ignore */ }
    if (skip) return;
    const wasReady = !!oldOrigin || tunnelStatus.state === "ready" || tunnelStatus.state === "degraded";
    // 仅在从未拿到地址时才立刻切备用；已就绪后断开优先同通道重连
    if (!wasReady && provider === "cloudflared") preferLocaltunnelNext = true;
    scheduleTunnelRestart(wasReady ? ("隧道断开 code " + code) : "未拿到地址，换通道", {
      forceLt: !wasReady && provider === "cloudflared",
      fromExit: true
    });
  });
}

function startLocaltunnelFallback() {
  // 无需额外全局安装：用 npx 拉起；微信偶发要过一次提示页，但仍比完全没码强
  if (!commandExists("npx")) throw new Error("npx 不可用，无法启用 localtunnel 备用通道");
  console.log("  启用备用通道 localtunnel …");
  tunnelStatus = { state: "starting", detail: "改用备用通道 localtunnel，正在申请公网地址…", updated_at: new Date().toISOString() };
  const child = spawn("npx", ["--yes", "localtunnel", "--port", String(PORT)], {
    cwd: ROOT,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  tunnelProc = child;
  attachTunnelIO(child, "localtunnel");
  setTimeout(() => {
    if (!liveTunnelOrigin && tunnelProc === child) {
      console.log("  localtunnel 超时未拿到地址，将重试…");
      preferLocaltunnelNext = false;
      try { child.kill(); } catch (e) { /* ignore */ }
    }
  }, 45000);
}

function startPublicTunnel() {
  if (String(process.env.GY_PUBLIC_TUNNEL || "1") === "0") {
    tunnelStatus = { state: "disabled", detail: "GY_PUBLIC_TUNNEL=0", updated_at: new Date().toISOString() };
    console.log("  已关闭公网隧道（GY_PUBLIC_TUNNEL=0）· 仅局域网扫码");
    return;
  }
  if (tunnelProc) return;
  tunnelBootAttempt += 1;
  // 优先 cloudflared（微信扫码更稳）；仅在明确失败后才切 localtunnel
  const useLt = preferLocaltunnelNext;
  preferLocaltunnelNext = false;
  tunnelStatus = {
    state: "starting",
    detail: useLt ? "正在用备用通道建立公网地址…" : "正在建立流量扫码隧道…",
    updated_at: new Date().toISOString()
  };
  (async () => {
    try { fs.writeFileSync(TUNNEL_LOG, ""); } catch (e) { /* ignore */ }

    if (!useLt) {
      try {
        const bin = await ensureCloudflaredBin();
        console.log("  正在建立流量扫码隧道（cloudflared / http2）…");
        tunnelStatus = { state: "starting", detail: "cloudflared 已就绪，正在申请公网地址…", updated_at: new Date().toISOString() };
        // http2 比 quic 在教室网络/防火墙下更稳，减少「扫了打不开」
        const child = spawn(bin, [
          "tunnel",
          "--url", `http://127.0.0.1:${PORT}`,
          "--no-autoupdate",
          "--protocol", "http2",
          "--edge-ip-version", "4"
        ], {
          cwd: ROOT,
          env: process.env,
          stdio: ["ignore", "pipe", "pipe"]
        });
        tunnelProc = child;
        attachTunnelIO(child, "cloudflared");
        // 给 quick tunnel 更长时间拿地址；仍无 URL 再切备用
        setTimeout(() => {
          if (!liveTunnelOrigin && tunnelProc === child) {
            console.log("  cloudflared 超时未拿到地址，切换备用通道…");
            scheduleTunnelRestart("cloudflared 超时未拿到地址", { forceLt: true });
          }
        }, 45000);
        return;
      } catch (err) {
        console.log("  [警告] cloudflared 准备失败：" + String(err.message || err));
        tunnelStatus = {
          state: "starting",
          detail: "cloudflared 失败，尝试备用通道… " + String(err.message || err).slice(0, 140),
          updated_at: new Date().toISOString()
        };
      }
    }

    try {
      startLocaltunnelFallback();
    } catch (err2) {
      preferLocaltunnelNext = false;
      tunnelStatus = {
        state: "error",
        detail: "公网隧道建立失败：" + String(err2.message || err2) + "。可在终端执行 brew install cloudflared 后重启「启动环境」，或点「绑定局域网」。",
        updated_at: new Date().toISOString()
      };
      console.log("  [错误] " + tunnelStatus.detail);
      if (tunnelRestartTimer) clearTimeout(tunnelRestartTimer);
      tunnelRestartTimer = setTimeout(() => startPublicTunnel(), 15000);
    }
  })().catch((err) => {
    tunnelStatus = { state: "error", detail: String(err.message || err), updated_at: new Date().toISOString() };
    console.log("  [错误] 启动隧道失败：" + tunnelStatus.detail);
  });
}

function loadClassroomConfig() {
  try {
    if (!fs.existsSync(CLASSROOM_FILE)) return null;
    const raw = JSON.parse(fs.readFileSync(CLASSROOM_FILE, "utf8"));
    if (!raw || typeof raw !== "object") return null;
    return raw;
  } catch (e) {
    return null;
  }
}

function saveClassroomConfig(cfg) {
  const payload = {
    version: 1,
    port: PORT,
    teacher_bookmark: TEACHER_BOOKMARK,
    fixed_origin: normalizeOrigin(cfg.fixed_origin),
    locked: cfg.locked !== false,
    updated_at: new Date().toISOString(),
    note: cfg.note || "扫码地址已永久锁定。除非点「重新绑定」，否则不会自动更换。"
  };
  fs.writeFileSync(CLASSROOM_FILE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

function writeAccessCard(phoneOrigin, lanOrigin, warn) {
  const phone = phoneOrigin || lanOrigin || "(尚未就绪：启动后会自动建立流量扫码隧道)";
  const text = [
    "光影盟 · 固定访问地址（请收藏）",
    "================================================",
    "",
    "【老师端 · 请收藏这一条，永远不变】",
    TEACHER_BOOKMARK,
    "",
    "【学生端（本机浏览器）】",
    `http://127.0.0.1:${PORT}${STUDENT_BOOKMARK_PATH}`,
    "",
    "【手机扫码 · 可用手机流量】",
    phone,
    phone.startsWith("http") ? `${phone}/?mode=checkin` : "",
    "",
    lanOrigin ? "【同 Wi‑Fi 备用局域网地址】" : "",
    lanOrigin || "",
    "",
    "说明：",
    "1. 老师收藏 127.0.0.1 地址；上课双击「启动环境」，保持窗口开着。",
    "2. 学生可用手机流量扫「流量扫码」地址（经公网隧道，老师电脑需能上网）。",
    "3. 隧道地址每次启动可能变化；以签到页二维码下方链接为准。",
    "4. 若只要局域网、不要隧道：启动前设置 GY_PUBLIC_TUNNEL=0。",
    warn ? "" : "",
    warn ? ("注意：" + warn) : "",
    "",
    "生成时间：" + new Date().toISOString(),
    ""
  ].filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n");
  try {
    fs.writeFileSync(ACCESS_FILE, text, "utf8");
  } catch (e) {
    /* ignore */
  }
  return text;
}

/**
 * 解析课堂扫码地址：
 * - 已锁定 → 永远返回锁定值，绝不因网卡变化自动更换
 * - 未锁定 → 仅首次自动绑定当前局域网，然后永久锁定
 */
function resolveClassroomOrigin(classroomOrigins, opts = {}) {
  const forceRebind = opts.forceRebind === true;
  const envFixed = normalizeOrigin(process.env.GY_FIXED_ORIGIN || "");
  let cfg = loadClassroomConfig();
  const liveHosts = new Set(
    classroomOrigins.map((o) => {
      try { return new URL(o).hostname; } catch (e) { return ""; }
    }).filter(Boolean)
  );

  // 环境变量：仅在尚未锁定，或显式要求重绑时写入
  if (envFixed && /^http:\/\//i.test(envFixed)) {
    let envHost = "";
    try { envHost = new URL(envFixed).hostname; } catch (e) { envHost = ""; }
    if (envHost && isClassroomLanHost(envHost) && !isPhoneUnfriendlyIp(envHost)) {
      const saved0 = cfg ? normalizeOrigin(cfg.fixed_origin) : "";
      if (forceRebind || !saved0 || cfg.locked === false) {
        cfg = saveClassroomConfig({
          fixed_origin: envFixed,
          locked: true,
          note: "由 GY_FIXED_ORIGIN 指定并永久锁定"
        });
        return { fixed_origin: envFixed, locked: true, cfg, changed: true, reason: "env", warn: "" };
      }
    }
  }

  const saved = cfg ? normalizeOrigin(cfg.fixed_origin) : "";
  let savedHost = "";
  try { savedHost = saved ? new URL(saved).hostname : ""; } catch (e) { savedHost = ""; }

  // 已永久锁定：绝不自动更换（这是「收藏后继续用」的关键）
  if (!forceRebind && saved && cfg && cfg.locked !== false && savedHost
    && isClassroomLanHost(savedHost) && !isPhoneUnfriendlyIp(savedHost)) {
    const live = liveHosts.has(savedHost);
    return {
      fixed_origin: saved,
      locked: true,
      cfg,
      changed: false,
      reason: live ? "locked" : "locked-stale",
      warn: live
        ? ""
        : `已锁定扫码地址 ${saved}，但当前网卡没有该 IP。请连回教室网，或把电脑静态 IP 设为 ${savedHost}；不要改收藏的老师端地址。`
    };
  }

  // 首次绑定 / 手动重绑：写入后永久锁定
  if (classroomOrigins[0]) {
    const next = classroomOrigins[0];
    cfg = saveClassroomConfig({
      fixed_origin: next,
      locked: true,
      note: forceRebind
        ? "教师手动重新绑定的扫码地址（已永久锁定）"
        : "首次自动绑定的扫码地址（已永久锁定，不会自动更换）"
    });
    return {
      fixed_origin: next,
      locked: true,
      cfg,
      changed: true,
      reason: forceRebind ? "rebind" : "first-bind",
      warn: ""
    };
  }

  if (forceRebind) {
    return {
      fixed_origin: saved && isClassroomLanHost(savedHost) ? saved : "",
      locked: !!(cfg && cfg.locked !== false),
      cfg,
      changed: false,
      reason: "rebind-failed",
      warn: "未检测到教室局域网（192.168/10），无法重绑。请先连接教室 Wi-Fi。"
    };
  }

  if (saved && savedHost && isClassroomLanHost(savedHost)) {
    return {
      fixed_origin: saved,
      locked: !!(cfg && cfg.locked !== false),
      cfg,
      changed: false,
      reason: "locked-stale",
      warn: "当前未检测到局域网，仍使用已锁定的扫码地址。"
    };
  }

  return { fixed_origin: "", locked: false, cfg, changed: false, reason: "none", warn: "尚未绑定手机扫码地址。" };
}

function writeOriginHint(opts = {}) {
  const lans = lanIPv4List();
  const origins = lans.map((x) => `http://${x.address}:${PORT}`);
  const classroomOrigins = origins.filter((o) => {
    try {
      const host = new URL(o).hostname;
      return isClassroomLanHost(host) && !isPhoneUnfriendlyIp(host);
    } catch (e) {
      return false;
    }
  });
  const resolved = resolveClassroomOrigin(classroomOrigins, opts);
  const fixed = resolved.fixed_origin;
  const tunnel = loadTunnelOrigin();
  // 手机流量优先公网隧道；同 Wi‑Fi 可用局域网
  const phoneOrigin = tunnel || fixed;
  // 老师收藏永远用环回地址
  const preferred = `http://127.0.0.1:${PORT}`;
  writeAccessCard(phoneOrigin, fixed, resolved.warn || (tunnel ? "" : "公网隧道尚未就绪：请确认已用 start.sh 启动，且老师电脑能上网。"));
  const payload = {
    port: PORT,
    generated_at: new Date().toISOString(),
    lan: lans,
    origins,
    classroom_mode: true,
    offline_local: !tunnel,
    mobile_data_ok: !!tunnel,
    tunnel_status: tunnelStatus,
    teacher_bookmark: TEACHER_BOOKMARK,
    student_bookmark: `http://127.0.0.1:${PORT}${STUDENT_BOOKMARK_PATH}`,
    fixed_origin: fixed,
    tunnel_origin: tunnel,
    phone_origin: phoneOrigin,
    fixed_locked: !!resolved.locked,
    fixed_reason: resolved.reason,
    fixed_warn: resolved.warn || "",
    preferred,
    teacher: TEACHER_BOOKMARK,
    checkin: phoneOrigin ? `${phoneOrigin}/?mode=checkin` : `${preferred}/?mode=checkin`,
    share_page: phoneOrigin ? `${phoneOrigin}${SHARE_PAGE_PATH}` : `${preferred}${SHARE_PAGE_PATH}`,
    share_local: `${preferred}${SHARE_PAGE_PATH}`,
    demo_sync: true,
    note: tunnel
      ? "手机可用流量扫 tunnel_origin；老师端仍用 127.0.0.1。"
      : "老师收藏 teacher_bookmark。隧道未就绪时暂用局域网 fixed_origin。"
  };
  try {
    fs.writeFileSync(path.join(ROOT, "gy-public-origin.json"), JSON.stringify(payload, null, 2));
  } catch (e) {
    /* ignore */
  }
  return payload;
}

function safeJoin(urlPath) {
  const decoded = decodeURIComponent((urlPath || "/").split("?")[0].split("#")[0]);
  let rel = decoded.replace(/\\/g, "/");
  if (rel === "/" || rel === "") rel = "/index.html";
  if (rel.endsWith("/")) rel += "index.html";
  const abs = path.normalize(path.join(ROOT, rel));
  if (!abs.startsWith(ROOT)) return null;
  return abs;
}

function isLocalAdmin(req) {
  const ra = String(req.socket?.remoteAddress || "");
  return ra === "127.0.0.1" || ra === "::1" || ra === "::ffff:127.0.0.1" || ra.endsWith("127.0.0.1");
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    return true;
  } catch (e) {
    return false;
  }
}

function loadShareConfig() {
  let folder = DEFAULT_SHARE_DIR;
  let enabled = true;
  try {
    if (fs.existsSync(SHARE_CFG_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SHARE_CFG_FILE, "utf8"));
      if (raw && typeof raw.folder === "string" && raw.folder.trim()) {
        folder = path.resolve(raw.folder.trim());
      }
      if (raw && raw.enabled === false) enabled = false;
    }
  } catch (e) { /* ignore */ }
  ensureDir(folder);
  return { folder, enabled, is_default: path.resolve(folder) === path.resolve(DEFAULT_SHARE_DIR) };
}

function saveShareConfig({ folder, enabled } = {}) {
  const prev = loadShareConfig();
  const nextFolder = folder != null && String(folder).trim()
    ? path.resolve(String(folder).trim())
    : prev.folder;
  const nextEnabled = enabled == null ? prev.enabled : !!enabled;
  if (!ensureDir(nextFolder)) {
    throw new Error("无法创建或访问该文件夹：" + nextFolder);
  }
  const st = fs.statSync(nextFolder);
  if (!st.isDirectory()) throw new Error("路径不是文件夹：" + nextFolder);
  const payload = {
    folder: nextFolder,
    enabled: nextEnabled,
    updated_at: new Date().toISOString()
  };
  fs.writeFileSync(SHARE_CFG_FILE, JSON.stringify(payload, null, 2), "utf8");
  return loadShareConfig();
}

function resolveUnderShareRoot(relPath) {
  const cfg = loadShareConfig();
  if (!cfg.enabled) return null;
  const root = path.resolve(cfg.folder);
  const raw = String(relPath || "").replace(/\\/g, "/").trim();
  if (raw.includes("\0")) return null;
  const parts = raw.split("/").filter((p) => p && p !== ".");
  if (parts.some((p) => p === "..")) return null;
  const abs = parts.length ? path.normalize(path.join(root, ...parts)) : root;
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;
  return { root, abs, rel: parts.join("/"), enabled: cfg.enabled, is_default: cfg.is_default };
}

/** 递归统计共享根下文件数（启动台徽标用） */
function listShareFiles(maxDepth = 3) {
  const cfg = loadShareConfig();
  const root = path.resolve(cfg.folder);
  const files = [];
  const walk = (dir, rel, depth) => {
    if (depth > maxDepth || files.length >= 500) return;
    let entries = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return; }
    entries.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    for (const ent of entries) {
      if (ent.name.startsWith(".")) continue;
      const childRel = rel ? `${rel}/${ent.name}` : ent.name;
      const childAbs = path.join(dir, ent.name);
      let st;
      try { st = fs.statSync(childAbs); } catch (e) { continue; }
      if (st.isDirectory()) {
        walk(childAbs, childRel, depth + 1);
      } else if (st.isFile()) {
        files.push({
          name: ent.name,
          path: childRel,
          size: st.size,
          mtime: st.mtimeMs
        });
      }
      if (files.length >= 500) break;
    }
  };
  if (cfg.enabled) walk(root, "", 0);
  return { folder: root, enabled: cfg.enabled, is_default: cfg.is_default, files };
}

/** 列出某一层目录：子文件夹 + 当前层文件（供下载页点选文件夹） */
function listShareDir(relPath = "") {
  const cfg = loadShareConfig();
  if (!cfg.enabled) {
    return {
      ok: false,
      enabled: false,
      folder: cfg.folder,
      is_default: cfg.is_default,
      path: "",
      parent: null,
      dirs: [],
      files: [],
      error: "共享未开启"
    };
  }
  const resolved = resolveUnderShareRoot(relPath);
  if (!resolved) {
    return {
      ok: false,
      enabled: true,
      folder: cfg.folder,
      is_default: cfg.is_default,
      path: String(relPath || ""),
      parent: null,
      dirs: [],
      files: [],
      error: "路径无效"
    };
  }
  let st;
  try { st = fs.statSync(resolved.abs); } catch (e) {
    return {
      ok: false,
      enabled: true,
      folder: cfg.folder,
      is_default: cfg.is_default,
      path: resolved.rel,
      parent: null,
      dirs: [],
      files: [],
      error: "文件夹不存在"
    };
  }
  if (!st.isDirectory()) {
    return {
      ok: false,
      enabled: true,
      folder: cfg.folder,
      is_default: cfg.is_default,
      path: resolved.rel,
      parent: null,
      dirs: [],
      files: [],
      error: "不是文件夹"
    };
  }
  let entries = [];
  try { entries = fs.readdirSync(resolved.abs, { withFileTypes: true }); } catch (e) {
    return {
      ok: false,
      enabled: true,
      folder: cfg.folder,
      is_default: cfg.is_default,
      path: resolved.rel,
      parent: parentRel(resolved.rel),
      dirs: [],
      files: [],
      error: "无法读取文件夹"
    };
  }
  entries.sort((a, b) => {
    if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
    return a.name.localeCompare(b.name, "zh");
  });
  const dirs = [];
  const files = [];
  for (const ent of entries) {
    if (ent.name.startsWith(".")) continue;
    const childRel = resolved.rel ? `${resolved.rel}/${ent.name}` : ent.name;
    const childAbs = path.join(resolved.abs, ent.name);
    let cst;
    try { cst = fs.statSync(childAbs); } catch (e) { continue; }
    if (cst.isDirectory()) {
      dirs.push({ name: ent.name, path: childRel });
    } else if (cst.isFile()) {
      files.push({
        name: ent.name,
        path: childRel,
        size: cst.size,
        mtime: cst.mtimeMs,
        size_label: formatBytes(cst.size),
        url: `/__gy/share/download?path=${encodeURIComponent(childRel)}`
      });
    }
  }
  return {
    ok: true,
    enabled: true,
    folder: cfg.folder,
    is_default: cfg.is_default,
    path: resolved.rel,
    parent: parentRel(resolved.rel),
    dirs,
    files
  };
}

function parentRel(rel) {
  const parts = String(rel || "").split("/").filter(Boolean);
  if (!parts.length) return null;
  parts.pop();
  return parts.join("/");
}

function formatBytes(n) {
  const v = Number(n) || 0;
  if (v < 1024) return v + " B";
  if (v < 1024 * 1024) return (v / 1024).toFixed(1) + " KB";
  if (v < 1024 * 1024 * 1024) return (v / (1024 * 1024)).toFixed(1) + " MB";
  return (v / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function contentDisposition(filename) {
  const raw = String(filename || "download").replace(/[\r\n"]/g, "_");
  const ascii = raw.replace(/[^\x20-\x7E]/g, "_") || "download";
  const encoded = encodeURIComponent(raw);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function sendShareDownload(res, absPath, downloadName) {
  let st;
  try { st = fs.statSync(absPath); } catch (e) {
    send(res, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  if (!st.isFile()) {
    send(res, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const ext = path.extname(absPath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Content-Length": st.size,
    "Content-Disposition": contentDisposition(downloadName || path.basename(absPath)),
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  createReadStream(absPath).on("error", () => {
    try { res.destroy(); } catch (e) { /* ignore */ }
  }).pipe(res);
}

function openFolderInOs(folder) {
  const dir = path.resolve(folder);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    throw new Error("文件夹不存在：" + dir);
  }
  const plat = process.platform;
  if (plat === "darwin") spawn("open", [dir], { detached: true, stdio: "ignore" }).unref();
  else if (plat === "win32") spawn("explorer", [dir], { detached: true, stdio: "ignore" }).unref();
  else spawn("xdg-open", [dir], { detached: true, stdio: "ignore" }).unref();
}

function sharePublicInfo(hint) {
  const listed = listShareFiles();
  const base = (hint && (hint.phone_origin || hint.tunnel_origin || hint.fixed_origin))
    || `http://127.0.0.1:${PORT}`;
  const local = `http://127.0.0.1:${PORT}${SHARE_PAGE_PATH}`;
  return {
    ok: true,
    enabled: listed.enabled,
    folder: listed.folder,
    is_default: listed.is_default,
    file_count: listed.files.length,
    page_path: SHARE_PAGE_PATH,
    student_url: `${normalizeOrigin(base)}${SHARE_PAGE_PATH}`,
    local_url: local,
    default_folder: DEFAULT_SHARE_DIR
  };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers
  });
  res.end(body);
}

function sendJson(res, status, obj) {
  send(res, status, JSON.stringify(obj), {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
}

function sendFile(res, filePath) {
  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not Found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || "application/octet-stream";
  const base = path.basename(filePath);
  const noStore = ext === ".html" || ext === ".js" || ext === ".mjs" || ext === ".json"
    || base === "index.html" || base === "gy-build.json";
  const data = fs.readFileSync(filePath);
  const headers = {
    "Content-Type": type,
    "Cache-Control": noStore ? "no-store, no-cache, must-revalidate" : "public, max-age=3600"
  };
  if (noStore) {
    headers.Pragma = "no-cache";
    headers.ETag = `"${fs.statSync(filePath).mtimeMs}"`;
  }
  send(res, 200, data, headers);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8").trim();
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function applyPath(root, pathStr, value) {
  const parts = String(pathStr || "").split("/").filter(Boolean);
  if (!parts.length) return;
  let cur = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (!cur[k] || typeof cur[k] !== "object") cur[k] = {};
    cur = cur[k];
  }
  const leaf = parts[parts.length - 1];
  if (value === null) delete cur[leaf];
  else cur[leaf] = value;
}

/** DEMO 共享库：内存 + 落盘，供老师端/手机端共用 */
let demoStore = { rev: 0, updated_at: 0, state: null };

function persistDemoStore() {
  try {
    fs.writeFileSync(DEMO_DB_FILE, JSON.stringify(demoStore));
  } catch (e) {
    console.warn("persist demo-db failed", e.message);
  }
}

function loadDemoStoreFromDisk() {
  try {
    if (!fs.existsSync(DEMO_DB_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(DEMO_DB_FILE, "utf8"));
    if (raw && typeof raw === "object") {
      demoStore = {
        rev: Number(raw.rev) || 0,
        updated_at: Number(raw.updated_at) || 0,
        state: raw.state || null
      };
    }
  } catch (e) {
    console.warn("load demo-db failed", e.message);
  }
}

loadDemoStoreFromDisk();

const netInfo = writeOriginHint();

const server = http.createServer(async (req, res) => {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  let u;
  try {
    u = new URL(req.url || "/", `http://${host}`);
  } catch (e) {
    send(res, 400, "Bad Request");
    return;
  }

  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  if (u.pathname === "/__gy/health") {
    sendJson(res, 200, {
      ok: true,
      service: "guangyingmeng",
      mode: "offline-local",
      port: PORT,
      time: new Date().toISOString()
    });
    return;
  }

  if (u.pathname === "/__gy/net.json" || u.pathname === "/gy-public-origin.json") {
    const fresh = writeOriginHint();
    sendJson(res, 200, fresh);
    return;
  }

  if (u.pathname === "/__gy/classroom") {
    if (req.method === "GET") {
      sendJson(res, 200, {
        ok: true,
        config: loadClassroomConfig(),
        hint: writeOriginHint()
      });
      return;
    }
    if (req.method === "PUT" || req.method === "POST") {
      try {
        const body = await readJson(req);
        // rebind=true：用当前网卡重新绑定一次（唯一允许换扫码地址的方式）
        if (body.rebind === true && !body.fixed_origin && !body.origin) {
          const hint = writeOriginHint({ forceRebind: true });
          if (hint.fixed_reason !== "rebind" && hint.fixed_reason !== "first-bind") {
            sendJson(res, 400, {
              ok: false,
              error: hint.fixed_warn || "未检测到教室局域网，请先连接教室 Wi-Fi 再重绑"
            });
            return;
          }
          sendJson(res, 200, { ok: true, rebound: true, config: loadClassroomConfig(), hint });
          return;
        }
        const origin = normalizeOrigin(body.fixed_origin || body.origin || "");
        if (!origin || !/^https?:\/\//i.test(origin)) {
          sendJson(res, 400, { ok: false, error: "请提供扫码地址：局域网 http://192.168.x.x:3000，或流量隧道 https://xxx.trycloudflare.com" });
          return;
        }
        let hostName = "";
        try { hostName = new URL(origin).hostname; } catch (e) {
          sendJson(res, 400, { ok: false, error: "地址无效" });
          return;
        }
        if (isPhoneUnfriendlyIp(hostName)) {
          sendJson(res, 400, { ok: false, error: "不能锁定 localhost / 云内网地址" });
          return;
        }
        const tunnelOk = isPublicTunnelHost(hostName) && /^https:\/\//i.test(origin);
        const lanOk = isClassroomLanHost(hostName) && /^http:\/\//i.test(origin);
        if (!tunnelOk && !lanOk) {
          sendJson(res, 400, { ok: false, error: "请使用教室局域网，或 Cloudflare/ngrok 等流量隧道地址" });
          return;
        }
        // 隧道地址写入 tunnel 文件，便于二维码立即采用；局域网仍写入 classroom 锁定
        if (tunnelOk) {
          try {
            fs.writeFileSync(TUNNEL_FILE, JSON.stringify({
              origin,
              updated_at: new Date().toISOString(),
              port: PORT,
              provider: "manual",
              note: "教师手动锁定的流量扫码地址"
            }, null, 2), "utf8");
          } catch (e) { /* ignore */ }
        }
        const cfg = tunnelOk
          ? (loadClassroomConfig() || saveClassroomConfig({ fixed_origin: "", locked: false, note: "流量扫码模式" }))
          : saveClassroomConfig({
            fixed_origin: origin,
            locked: body.locked !== false,
            note: body.note || "教师手动锁定的本机扫码地址（永久，不自动更换）"
          });
        if (tunnelOk && body.locked !== false && !cfg.fixed_origin) {
          /* keep lan lock untouched */
        }
        sendJson(res, 200, { ok: true, config: cfg, hint: writeOriginHint(), tunnel: tunnelOk });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: String(e.message || e) });
      }
      return;
    }
  }

  if (u.pathname === "/__gy/tunnel") {
    if (req.method === "GET") {
      const tunnel = loadTunnelOrigin();
      sendJson(res, 200, {
        ok: !!tunnel,
        tunnel_origin: tunnel,
        mobile_data_ok: !!tunnel,
        tunnel_status: tunnelStatus,
        hint: writeOriginHint()
      });
      return;
    }
    if (req.method === "POST" || req.method === "PUT") {
      try {
        const body = await readJson(req).catch(() => ({}));
        if (body && body.origin) {
          const o = saveTunnelOrigin(body.origin, "manual");
          if (!o) {
            sendJson(res, 400, { ok: false, error: "请提供 https://xxx.trycloudflare.com 这类隧道地址" });
            return;
          }
          sendJson(res, 200, { ok: true, tunnel_origin: o, hint: writeOriginHint() });
          return;
        }
        // 重启隧道（抑制旧进程 exit 触发的自动重连，避免双开）
        if (tunnelProc) {
          suppressTunnelRestart = true;
          try { tunnelProc.kill(); } catch (e) { /* ignore */ }
          tunnelProc = null;
        }
        liveTunnelOrigin = "";
        liveTunnelProvider = "";
        preferLocaltunnelNext = false;
        tunnelBootAttempt = 0;
        tunnelFailStreak = 0;
        lastTunnelRestartAt = 0; // 老师手动重建，不受冷却限制
        stopTunnelHeartbeat();
        clearTunnelOriginFile();
        startPublicTunnel();
        sendJson(res, 200, { ok: true, restarting: true, tunnel_status: tunnelStatus });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: String(e.message || e) });
      }
      return;
    }
  }

  // ---- DEMO 跨设备同步 ----
  if (u.pathname === "/__gy/demo-db") {
    if (req.method === "GET") {
      sendJson(res, 200, {
        sync: true,
        rev: demoStore.rev,
        updated_at: demoStore.updated_at,
        state: demoStore.state
      });
      return;
    }
    if (req.method === "PUT") {
      try {
        const body = await readJson(req);
        const clientRev = body.rev == null ? null : Number(body.rev);
        if (clientRev != null && Number.isFinite(clientRev) && clientRev < demoStore.rev && demoStore.state) {
          sendJson(res, 409, {
            ok: false,
            conflict: true,
            rev: demoStore.rev,
            updated_at: demoStore.updated_at,
            state: demoStore.state
          });
          return;
        }
        if (!body.state || typeof body.state !== "object") {
          sendJson(res, 400, { ok: false, error: "missing state" });
          return;
        }
        demoStore.state = body.state;
        demoStore.rev = (demoStore.rev || 0) + 1;
        demoStore.updated_at = Date.now();
        persistDemoStore();
        sendJson(res, 200, {
          ok: true,
          rev: demoStore.rev,
          updated_at: demoStore.updated_at,
          state: demoStore.state
        });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: String(e.message || e) });
      }
      return;
    }
  }

  if (u.pathname === "/__gy/demo-db/patch" && req.method === "POST") {
    try {
      const body = await readJson(req);
      const updates = body.updates && typeof body.updates === "object" ? body.updates : null;
      if (!updates) {
        sendJson(res, 400, { ok: false, error: "missing updates" });
        return;
      }
      if (!demoStore.state || typeof demoStore.state !== "object") {
        demoStore.state = {};
      }
      // 深拷贝后打补丁，避免引用污染
      const next = JSON.parse(JSON.stringify(demoStore.state));
      Object.entries(updates).forEach(([p, v]) => applyPath(next, p, v));
      demoStore.state = next;
      demoStore.rev = (demoStore.rev || 0) + 1;
      demoStore.updated_at = Date.now();
      persistDemoStore();
      sendJson(res, 200, {
        ok: true,
        rev: demoStore.rev,
        updated_at: demoStore.updated_at,
        state: demoStore.state
      });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e.message || e) });
    }
    return;
  }

  if (u.pathname === "/__gy/demo-db/reset" && req.method === "POST") {
    demoStore = { rev: 0, updated_at: Date.now(), state: null };
    try { fs.unlinkSync(DEMO_DB_FILE); } catch (e) { /* ignore */ }
    sendJson(res, 200, { ok: true, rev: 0, state: null });
    return;
  }

  if (u.pathname === "/__gy/build" && req.method === "GET") {
    const buildFile = path.join(ROOT, "gy-build.json");
    let build = { short: "local", synced_at: "", path: ROOT, commit: "" };
    try {
      if (fs.existsSync(buildFile)) build = JSON.parse(fs.readFileSync(buildFile, "utf8"));
    } catch (e) { /* ignore */ }
    try {
      const st = fs.statSync(path.join(ROOT, "index.html"));
      build.index_mtime = st.mtimeMs;
      build.index_bytes = st.size;
    } catch (e) { /* ignore */ }
    sendJson(res, 200, build);
    return;
  }

  // ---- 课堂资料共享：老师指定本机文件夹，学生下载 ----
  if (u.pathname === "/__gy/share") {
    if (req.method === "GET") {
      sendJson(res, 200, {
        ...sharePublicInfo(writeOriginHint()),
        can_manage: isLocalAdmin(req)
      });
      return;
    }
    if (req.method === "POST" || req.method === "PUT") {
      if (!isLocalAdmin(req)) {
        sendJson(res, 403, { ok: false, error: "仅老师本机可修改共享文件夹（请用 127.0.0.1 打开启动台）" });
        return;
      }
      try {
        const body = await readJson(req).catch(() => ({}));
        if (body.use_default === true) {
          const cfg = saveShareConfig({ folder: DEFAULT_SHARE_DIR, enabled: body.enabled });
          sendJson(res, 200, { ok: true, ...sharePublicInfo(writeOriginHint()), config: cfg });
          return;
        }
        if (body.folder != null && !String(body.folder).trim()) {
          sendJson(res, 400, { ok: false, error: "请填写本机文件夹绝对路径，例如 /Users/你/Desktop/课件" });
          return;
        }
        const cfg = saveShareConfig({
          folder: body.folder,
          enabled: body.enabled
        });
        sendJson(res, 200, { ok: true, ...sharePublicInfo(writeOriginHint()), config: cfg });
      } catch (e) {
        sendJson(res, 400, { ok: false, error: String(e.message || e) });
      }
      return;
    }
  }

  if (u.pathname === "/__gy/share/list" && req.method === "GET") {
    // flat=1：递归全部文件（兼容旧逻辑）；默认按 path 浏览当前层文件夹
    if (u.searchParams.get("flat") === "1") {
      const listed = listShareFiles();
      sendJson(res, 200, {
        ok: true,
        enabled: listed.enabled,
        folder: listed.folder,
        is_default: listed.is_default,
        path: "",
        parent: null,
        dirs: [],
        files: listed.files.map((f) => ({
          ...f,
          size_label: formatBytes(f.size),
          url: `/__gy/share/download?path=${encodeURIComponent(f.path)}`
        })),
        can_manage: isLocalAdmin(req)
      });
      return;
    }
    const dirPath = u.searchParams.get("path") || "";
    const listed = listShareDir(dirPath);
    sendJson(res, listed.ok === false && listed.error === "共享未开启" ? 200 : 200, {
      ...listed,
      can_manage: isLocalAdmin(req)
    });
    return;
  }

  if (u.pathname === "/__gy/share/open" && (req.method === "POST" || req.method === "GET")) {
    if (!isLocalAdmin(req)) {
      sendJson(res, 403, { ok: false, error: "仅老师本机可打开文件夹" });
      return;
    }
    try {
      const cfg = loadShareConfig();
      openFolderInOs(cfg.folder);
      sendJson(res, 200, { ok: true, folder: cfg.folder });
    } catch (e) {
      sendJson(res, 400, { ok: false, error: String(e.message || e) });
    }
    return;
  }

  if (u.pathname === "/__gy/share/download" && req.method === "GET") {
    const rel = u.searchParams.get("path") || u.searchParams.get("file") || "";
    const resolved = resolveUnderShareRoot(rel);
    if (!resolved) {
      send(res, 404, "文件不存在或共享未开启", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    sendShareDownload(res, resolved.abs, path.basename(resolved.abs));
    return;
  }

  // 友好短链：/share/文件相对路径
  if (u.pathname === "/share" || u.pathname === "/share/") {
    sendFile(res, path.join(ROOT, "share.html"));
    return;
  }
  if (u.pathname.startsWith("/share/")) {
    const rel = decodeURIComponent(u.pathname.slice("/share/".length));
    if (!rel || rel === "index.html") {
      sendFile(res, path.join(ROOT, "share.html"));
      return;
    }
    const resolved = resolveUnderShareRoot(rel);
    if (!resolved) {
      send(res, 404, "文件不存在或共享未开启", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    sendShareDownload(res, resolved.abs, path.basename(resolved.abs));
    return;
  }

  const filePath = safeJoin(u.pathname);
  if (!filePath) {
    send(res, 403, "Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendFile(res, path.join(ROOT, "index.html"));
    return;
  }
  sendFile(res, filePath);
});

server.listen(PORT, HOST, () => {
  // 启动时清掉上一次的过期隧道，避免二维码仍指向已失效地址
  liveTunnelOrigin = "";
  clearTunnelOriginFile();
  tunnelStatus = { state: "starting", detail: "服务已启动，正在建立公网隧道…", updated_at: new Date().toISOString() };
  ensureDir(DEFAULT_SHARE_DIR);
  loadShareConfig();
  const fresh = writeOriginHint();
  const fixed = fresh.fixed_origin || "";
  const shareInfo = sharePublicInfo(fresh);
  console.log("");
  console.log("  ========================================");
  console.log("  光影盟 · 课堂服务");
  console.log("  ========================================");
  console.log("  ★ 老师收藏（永远不变）:");
  console.log("    " + TEACHER_BOOKMARK);
  console.log("  ★ 启动台:");
  console.log("    http://127.0.0.1:" + PORT + "/launcher.html");
  console.log("  ★ 课堂资料下载:");
  console.log("    " + shareInfo.local_url);
  console.log("    共享文件夹: " + shareInfo.folder);
  if (fixed) {
    console.log("  · 局域网备用：" + fixed);
  }
  console.log("  · 正在准备流量扫码隧道（约 10–30 秒）…");
  console.log("  详情已写入: 固定访问地址.txt");
  console.log("  按 Ctrl+C 停止；关闭窗口即下课");
  console.log("");
  startPublicTunnel();
});

process.on("exit", () => {
  if (tunnelProc) {
    try { tunnelProc.kill(); } catch (e) { /* ignore */ }
  }
});
["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => {
    if (tunnelProc) {
      try { tunnelProc.kill(); } catch (e) { /* ignore */ }
    }
    process.exit(0);
  });
});
