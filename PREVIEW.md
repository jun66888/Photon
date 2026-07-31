# 预览说明

## 云端预览（当前可用）

**老师端：** https://postcards-school-seem-specializing.trycloudflare.com/?mode=teacher

**学生端：** https://postcards-school-seem-specializing.trycloudflare.com/?mode=student

> 隧道由云端 Agent 临时拉起；关掉 Agent 或隧道后会失效。失效时在本仓库执行下面「重开隧道」。

## 本机打不开时排查

1. 确认在 **Photon 项目目录**（里面有 `index.html`、`package.json`）
2. 先安装再启动：
   ```bash
   npm install
   npm start
   ```
   Windows 也可双击 `start.bat`
3. 终端里出现 `Serving!` / `Local: http://localhost:3000` 后再打开浏览器
4. 正确地址是：
   - http://localhost:3000/?mode=teacher
   - 不要用 `https://`，也不要直接双击 `index.html`（`file://` 部分功能可能异常）
5. 若 3000 被占用，可改端口：
   ```bash
   npx --yes serve -l 4173 .
   ```
   再打开 http://localhost:4173/?mode=teacher

## 重开隧道（可选公网链接）

```bash
npm start
# 另开一个终端（建议 http2，QUIC 在部分环境会断连）
cloudflared tunnel --url http://127.0.0.1:3000 --no-autoupdate --protocol http2
```

终端里会出现新的 `https://xxxx.trycloudflare.com` 链接。

## 本机常用地址

```bash
npm install
npm start
# http://localhost:3000/?mode=teacher
```
