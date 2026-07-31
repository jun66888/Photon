#!/usr/bin/env node
/**
 * 光影盟本地服务：静态站 + 局域网地址 + DEMO 跨设备共享库
 * 手机签到 / 老师投屏共用 /__gy/demo-db，实现实时同步（无需 Firebase）
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const DEMO_DB_FILE = path.join(ROOT, "gy-demo-db.json");
const CLASSROOM_FILE = path.join(ROOT, "gy-classroom.json");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".bat": "text/plain; charset=utf-8",
  ".sh": "text/plain; charset=utf-8"
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
    port: Number(cfg.port) || PORT,
    fixed_origin: normalizeOrigin(cfg.fixed_origin),
    locked: cfg.locked !== false,
    updated_at: new Date().toISOString(),
    note: cfg.note || "本机课堂固定扫码地址。手机与电脑同一 Wi-Fi；建议给电脑设置静态 IP，地址长期不变。"
  };
  fs.writeFileSync(CLASSROOM_FILE, JSON.stringify(payload, null, 2), "utf8");
  return payload;
}

/** 解析并持久化课堂固定地址：优先本机局域网，不依赖公网隧道 */
function resolveClassroomOrigin(classroomOrigins) {
  const envFixed = normalizeOrigin(process.env.GY_FIXED_ORIGIN || "");
  let cfg = loadClassroomConfig();
  const liveHosts = new Set(
    classroomOrigins.map((o) => {
      try { return new URL(o).hostname; } catch (e) { return ""; }
    }).filter(Boolean)
  );

  // 环境变量最高优先级（运维手动指定）
  if (envFixed && /^https?:\/\//i.test(envFixed)) {
    let envHost = "";
    try { envHost = new URL(envFixed).hostname; } catch (e) { envHost = ""; }
    if (envHost && !isPhoneUnfriendlyIp(envHost)) {
      cfg = saveClassroomConfig({
        port: PORT,
        fixed_origin: envFixed,
        locked: true,
        note: "由 GY_FIXED_ORIGIN 指定"
      });
      return { fixed_origin: envFixed, locked: true, cfg, changed: true, reason: "env" };
    }
  }

  const saved = cfg ? normalizeOrigin(cfg.fixed_origin) : "";
  let savedHost = "";
  try { savedHost = saved ? new URL(saved).hostname : ""; } catch (e) { savedHost = ""; }

  // 已锁定且该网卡 IP 仍在：地址固定，二维码不换
  if (saved && cfg && cfg.locked !== false && savedHost && liveHosts.has(savedHost)
    && !isPhoneUnfriendlyIp(savedHost)) {
    return { fixed_origin: saved, locked: true, cfg, changed: false, reason: "locked" };
  }

  // 有可用教室局域网：写入/更新固定地址
  if (classroomOrigins[0]) {
    const next = classroomOrigins[0];
    const nextHost = new URL(next).hostname;
    const changed = !saved || savedHost !== nextHost;
    cfg = saveClassroomConfig({
      port: PORT,
      fixed_origin: next,
      locked: true,
      note: changed && saved
        ? "检测到网卡 IP 变化，已自动更新固定扫码地址。若经常变化，请给电脑设置静态 IP / DHCP 保留。"
        : "本机课堂固定扫码地址。手机与电脑同一 Wi-Fi；建议给电脑设置静态 IP。"
    });
    return {
      fixed_origin: next,
      locked: true,
      cfg,
      changed,
      reason: changed && saved ? "ip-changed" : "auto-bind"
    };
  }

  // 无局域网时：若曾锁定过教室地址仍返回（电脑暂时没连上 Wi-Fi）
  if (saved && savedHost && isClassroomLanHost(savedHost)) {
    return { fixed_origin: saved, locked: !!(cfg && cfg.locked !== false), cfg, changed: false, reason: "offline-keep" };
  }

  return { fixed_origin: "", locked: false, cfg, changed: false, reason: "none" };
}

function writeOriginHint() {
  const lans = lanIPv4List();
  const origins = lans.map((x) => `http://${x.address}:${PORT}`);
  const envPublic = normalizeOrigin(process.env.GY_PUBLIC_ORIGIN || "");
  // 课堂优先真实局域网；公网隧道不参与课堂固定地址
  const classroomOrigins = origins.filter((o) => {
    try {
      const host = new URL(o).hostname;
      return isClassroomLanHost(host) && !isPhoneUnfriendlyIp(host);
    } catch (e) {
      return false;
    }
  });
  const resolved = resolveClassroomOrigin(classroomOrigins);
  const fixed = resolved.fixed_origin;
  // preferred：固定局域网 > 当前教室网卡 > localhost（课堂不用临时隧道当首选）
  const preferred = fixed || classroomOrigins[0] || `http://127.0.0.1:${PORT}`;
  const payload = {
    port: PORT,
    generated_at: new Date().toISOString(),
    lan: lans,
    origins,
    classroom_mode: true,
    fixed_origin: fixed,
    fixed_locked: !!resolved.locked,
    fixed_reason: resolved.reason,
    public_tunnel: envPublic || "",
    preferred,
    teacher: `${preferred}/?mode=teacher`,
    checkin: `${preferred}/?view=checkin`,
    demo_sync: true,
    note: "课堂请用 fixed_origin（本机局域网）。临时公网隧道仅开发预览，不稳定、不应用于正式上课。"
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
  const noCache = ext === ".html" || ext === ".js" || ext === ".json";
  const data = fs.readFileSync(filePath);
  send(res, 200, data, {
    "Content-Type": type,
    "Cache-Control": noCache ? "no-cache" : "public, max-age=3600"
  });
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
        const origin = normalizeOrigin(body.fixed_origin || body.origin || "");
        if (!origin || !/^https?:\/\//i.test(origin)) {
          sendJson(res, 400, { ok: false, error: "请提供 fixed_origin，例如 http://192.168.1.8:3000" });
          return;
        }
        let host = "";
        try { host = new URL(origin).hostname; } catch (e) {
          sendJson(res, 400, { ok: false, error: "地址无效" });
          return;
        }
        if (isPhoneUnfriendlyIp(host)) {
          sendJson(res, 400, { ok: false, error: "不能锁定 localhost / 云内网地址" });
          return;
        }
        if (!isClassroomLanHost(host) && body.force !== true) {
          sendJson(res, 400, { ok: false, error: "请锁定教室局域网地址（192.168.x.x / 10.x.x.x）" });
          return;
        }
        const cfg = saveClassroomConfig({
          port: PORT,
          fixed_origin: origin,
          locked: body.locked !== false,
          note: body.note || "教师手动锁定的课堂扫码地址"
        });
        sendJson(res, 200, { ok: true, config: cfg, hint: writeOriginHint() });
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
  const fresh = writeOriginHint();
  const local = `http://127.0.0.1:${PORT}/?mode=teacher`;
  const fixed = fresh.fixed_origin || "";
  console.log("");
  console.log("  ========================================");
  console.log("  光影盟 · 本机课堂服务已启动（稳定模式）");
  console.log("  ========================================");
  console.log("  电脑打开:    " + local);
  if (fixed) {
    console.log("  ★ 固定扫码:  " + fixed + "/?mode=checkin");
    console.log("  ★ 手机同网:  " + fixed + "/?mode=teacher");
    console.log("  二维码请用「固定扫码」地址（不要扫 localhost）");
    if (fresh.fixed_reason === "ip-changed") {
      console.log("  ! 网卡 IP 已变化，固定地址已自动更新。建议设置静态 IP 保持长期不变。");
    }
  } else {
    console.log("  ! 未检测到教室局域网（192.168/10）。请连接教室 Wi-Fi 后重启本程序。");
  }
  if (fresh.public_tunnel) {
    console.log("  （检测到临时公网隧道环境变量；正式上课请忽略，只用本机固定地址）");
  }
  console.log("  健康检查:    http://127.0.0.1:" + PORT + "/__gy/health");
  console.log("  按 Ctrl+C 停止；关闭窗口即下课");
  console.log("");
});
