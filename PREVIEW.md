# 预览说明

## 云端预览（当前可用）

**老师端：** https://postcards-school-seem-specializing.trycloudflare.com/?mode=teacher

**学生端：** https://postcards-school-seem-specializing.trycloudflare.com/?mode=student

> 隧道由云端 Agent 临时拉起；关掉 Agent 或隧道后会失效。失效时在本仓库执行下面「重开隧道」。

## 微信扫码（重要）

二维码库已放在仓库 `vendor/`，不依赖外网 CDN。

1. **推荐**：用上面的云端预览（或本机局域网 IP / 自建隧道）打开老师端，再生成签到/投票码。
2. 若老师端开在 `localhost`，手机扫不开本机地址。在二维码上方的「手机扫码地址」填入例如：
   - `http://192.168.x.x:3000`（手机与电脑同一 Wi‑Fi）
   - 或当前公网隧道 `https://xxxx.trycloudflare.com`
   然后点「应用到二维码」再扫。
3. 二维码下方会显示完整链接，可用微信确认能否打开。

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

终端里会出现新的 `https://xxxx.trycloudflare.com` 链接。把该地址填进「手机扫码地址」后再生成二维码。

## 本机常用地址

```bash
npm install
npm start
# http://localhost:3000/?mode=teacher
```
