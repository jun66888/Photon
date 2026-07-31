#!/usr/bin/env node
/**
 * 光影盟本地服务：静态站 + 局域网地址探测（供手机扫码）
 * 避免 serve 的 /index.html → /index 重定向丢掉 ?mode=&code=
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
  // 优先常见私网
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
    note: "手机与电脑同一 Wi-Fi 时用局域网 preferred；云端预览可用 public_tunnel"
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
  res.writeHead(status, headers);
  res.end(body);
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
    "Cache-Control": noCache ? "no-cache" : "public, max-age=3600",
    "Access-Control-Allow-Origin": "*"
  });
}

const netInfo = writeOriginHint();

const server = http.createServer((req, res) => {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  let u;
  try {
    u = new URL(req.url || "/", `http://${host}`);
  } catch (e) {
    send(res, 400, "Bad Request");
    return;
  }

  // 网络信息：给前端自动填「手机扫码地址」
  if (u.pathname === "/__gy/net.json" || u.pathname === "/gy-public-origin.json") {
    const fresh = writeOriginHint();
    send(res, 200, JSON.stringify(fresh), {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*"
    });
    return;
  }

  // 单页：任意路径都回 index.html，查询参数保留在浏览器地址栏（不 301）
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
  console.log("  光影盟 · 本地服务已启动");
  console.log("  电脑打开:  " + local);
  if (netInfo.origins.length) {
    console.log("  手机同网:  " + netInfo.preferred + "/?mode=teacher");
    console.log("  扫码请用上述「手机同网」地址（不要用 localhost）");
  } else {
    console.log("  未检测到局域网 IP，手机扫码需自建隧道或手动填地址");
  }
  console.log("  按 Ctrl+C 停止");
  console.log("");
});
