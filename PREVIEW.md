# 预览与使用

## 推荐：本机主用（稳妥、断网可用）

公网隧道适合临时看一眼；**正式上课请在自己电脑本地跑**，不依赖外网。

1. 安装一次 [Node.js LTS](https://nodejs.org/)（只要 Node，不必每次 `npm install`）
2. 拉取本分支后，在项目目录：
   - **Windows**：双击 `start.bat`
   - **Mac / Linux**：`./start.sh` 或 `npm start`
3. 浏览器会打开：**http://localhost:3000/?mode=teacher**
4. 手机与电脑同一 Wi‑Fi，用终端打印的 `http://192.168.x.x:3000`（不要扫 localhost）

资源已在 `vendor/`（字体、二维码），默认 DEMO 模式不连 Firebase，断网也能用老师端 + 同网签到同步。

```bash
git checkout cursor/guangyingmeng-arena-f9c7
git pull
# Windows: 双击 start.bat
npm start
```

健康检查：http://127.0.0.1:3000/__gy/health → 应看到 `"ok":true`

---

## 备用：公网临时预览（网络不稳时可能挂）

当前云端隧道（仅调试用，会过期）：

- 老师端：https://clearance-coupled-furthermore-ties.trycloudflare.com/?mode=teacher
- 学生端：https://clearance-coupled-furthermore-ties.trycloudflare.com/?mode=student

本机也要临时公网时：先 `npm start`，另开终端 `npm run tunnel`，把新地址填进「手机扫码地址」。

---

## 注意

Cursor Cloud Agent 里的 `localhost` **不是**你电脑上的地址；在 Agent 对话里点 localhost 打不开是正常的。要稳妥预览，请用上面的「本机主用」。
