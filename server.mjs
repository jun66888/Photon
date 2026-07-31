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
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)) return 2;
    return 9;
  };
  out.sort((a, b) => score(a.address) - score(b.address));
  return out;
}

function writeOriginHint() {
  const lans = lanIPv4List();
  const origins = lans.map((x) => `http://${x.address}:${PORT}`);
  const envPublic = String(process.env.GY_PUBLIC_ORIGIN || "").trim().replace(/\/$/, "");
  const preferred = envPublic || origins[0] || `http://127.0.0.1:${PORT}`;
  const payload = {
    port: PORT,
    generated_at: new Date().toISOString(),
    lan: lans,
    origins,
    public_tunnel: envPublic || "",
    preferred,
    teacher: `${preferred}/?mode=teacher`,
    demo_sync: true,
    note: "手机与电脑同一 Wi-Fi 时用局域网 preferred；扫码签到经 /__gy/demo-db 与老师端实时同步"
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

  if (u.pathname === "/__gy/net.json" || u.pathname === "/gy-public-origin.json") {
    const fresh = writeOriginHint();
    sendJson(res, 200, fresh);
    return;
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
  const local = `http://127.0.0.1:${PORT}/?mode=teacher`;
  console.log("");
  console.log("  光影盟 · 本地服务已启动（含 DEMO 跨设备同步）");
  console.log("  电脑打开:  " + local);
  if (netInfo.origins.length) {
    console.log("  手机同网:  " + netInfo.preferred + "/?mode=teacher");
    console.log("  扫码请用上述「手机同网」地址（不要用 localhost）");
  } else {
    console.log("  未检测到局域网 IP，可用公网隧道；签到同步依赖本服务 /__gy/demo-db");
  }
  console.log("  同步接口: http://127.0.0.1:" + PORT + "/__gy/demo-db");
  console.log("  按 Ctrl+C 停止");
  console.log("");
});
