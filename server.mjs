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
/** 端口写死 3000，老师收藏地址才不会变（勿随意改 PORT） */
const PORT = Number(process.env.PORT || 3000) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const DEMO_DB_FILE = path.join(ROOT, "gy-demo-db.json");
const CLASSROOM_FILE = path.join(ROOT, "gy-classroom.json");
const ACCESS_FILE = path.join(ROOT, "固定访问地址.txt");
/** 老师端永久收藏地址（本机环回，永远不变） */
const TEACHER_BOOKMARK = `http://127.0.0.1:${PORT}/?mode=teacher`;
const STUDENT_BOOKMARK_PATH = `/?mode=student`;

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

function writeAccessCard(fixedOrigin, warn) {
  const phone = fixedOrigin || "(尚未绑定：请连教室 Wi-Fi 后双击「绑定课堂扫码地址.bat」一次)";
  const text = [
    "光影盟 · 固定访问地址（本机离线，请收藏）",
    "================================================",
    "",
    "【老师端 · 请收藏这一条，永远不变】",
    TEACHER_BOOKMARK,
    "",
    "【学生端（本机浏览器）】",
    `http://127.0.0.1:${PORT}${STUDENT_BOOKMARK_PATH}`,
    "",
    "【手机扫码 / 学生手机 · 已锁定，不会自动更换】",
    phone,
    phone.startsWith("http") ? `${phone}/?mode=checkin` : "",
    "",
    "说明：",
    "1. 老师只要收藏上面的 127.0.0.1 地址，下次 start.bat 打开后即可继续用。",
    "2. 手机扫码地址写入 gy-classroom.json 后永久锁定；DHCP 换 IP 也不会自动改。",
    "3. 若手机突然扫不开：给电脑设静态 IP 为锁定的那个地址，或运行「绑定课堂扫码地址.bat」手动重绑一次。",
    "4. 不要使用任何临时公网链接。",
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
  // 老师收藏永远用环回地址；手机扫码才用 fixed_origin
  const preferred = `http://127.0.0.1:${PORT}`;
  writeAccessCard(fixed, resolved.warn || "");
  const payload = {
    port: PORT,
    generated_at: new Date().toISOString(),
    lan: lans,
    origins,
    classroom_mode: true,
    offline_local: true,
    teacher_bookmark: TEACHER_BOOKMARK,
    student_bookmark: `http://127.0.0.1:${PORT}${STUDENT_BOOKMARK_PATH}`,
    fixed_origin: fixed,
    fixed_locked: !!resolved.locked,
    fixed_reason: resolved.reason,
    fixed_warn: resolved.warn || "",
    preferred,
    teacher: TEACHER_BOOKMARK,
    checkin: fixed ? `${fixed}/?mode=checkin` : `${preferred}/?mode=checkin`,
    demo_sync: true,
    note: "老师收藏 teacher_bookmark（永远不变）。手机扫码用 fixed_origin（锁定后不自动更换）。"
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
        if (!origin || !/^http:\/\//i.test(origin)) {
          sendJson(res, 400, { ok: false, error: "请提供本机局域网地址，例如 http://192.168.1.8:3000（仅 http，不要公网域名）" });
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
        if (!isClassroomLanHost(hostName)) {
          sendJson(res, 400, { ok: false, error: "只能锁定教室局域网（192.168.x.x / 10.x.x.x）" });
          return;
        }
        const cfg = saveClassroomConfig({
          fixed_origin: origin,
          locked: body.locked !== false,
          note: body.note || "教师手动锁定的本机扫码地址（永久，不自动更换）"
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
  const fixed = fresh.fixed_origin || "";
  console.log("");
  console.log("  ========================================");
  console.log("  光影盟 · 本机离线课堂（地址永久固定）");
  console.log("  ========================================");
  console.log("  ★ 老师收藏（永远不变）:");
  console.log("    " + TEACHER_BOOKMARK);
  if (fixed) {
    console.log("  ★ 手机扫码（已锁定，不自动更换）:");
    console.log("    " + fixed + "/?mode=checkin");
    if (fresh.fixed_reason === "first-bind") {
      console.log("  （首次已自动绑定扫码地址，已写入 gy-classroom.json）");
    }
    if (fresh.fixed_warn) {
      console.log("  ! " + fresh.fixed_warn);
    }
  } else {
    console.log("  ! 尚未绑定手机扫码地址。请连教室 Wi-Fi 后：");
    console.log("    双击「绑定课堂扫码地址.bat」，或重启本程序自动首次绑定");
  }
  console.log("  详情已写入: 固定访问地址.txt");
  console.log("  按 Ctrl+C 停止；关闭窗口即下课");
  console.log("");
});
