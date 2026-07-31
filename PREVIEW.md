# 访问说明（打不开先看这里）

## 先分清：你打开的是哪一种地址？

| 你输入的地址 | 实际指向 | 能不能在你电脑打开 |
| --- | --- | --- |
| `http://localhost:3000` | **你自己电脑**上的服务 | 只有你本机先 `npm start` / 双击 `start.bat` 才行 |
| `http://172.30.x.x:3000` | Cursor **云端虚拟机**内网 | 你家里电脑/手机永远打不开 |
| `https://xxxx.trycloudflare.com` | 云端临时公网隧道 | 可能被网络拦截；且**隔天会变** |
| `https://xxxx.loca.lt` | 另一条临时隧道 | 偶尔要过提醒页；也不稳定 |

**结论：课堂正式使用，请在你自己的电脑本地启动，不要依赖云端 `localhost`。**

---

## 推荐：本机一键启动（断网也能用）

1. 安装 [Node.js LTS](https://nodejs.org)
2. 拉取本分支代码后，在项目目录：
   - **Windows**：双击 `start.bat`（会自动打开浏览器）
   - **Mac/Linux**：`./start.sh` 或 `npm start`
3. 浏览器打开：**http://localhost:3000/?mode=teacher**
4. 手机与电脑连**同一 Wi‑Fi**，用终端打印的 `http://192.168.x.x:3000`（不要扫 localhost）

```bash
git checkout cursor/guangyingmeng-arena-f9c7
git pull
npm install
npm start
```

---

## 云端临时预览（仅调试用，可能打不开）

当前云端 Agent 里服务已启动。若你所在网络能访问临时隧道，可试：

**Cloudflare 隧道（优先试这个）**

- 老师端：https://relatively-trout-through-traditional.trycloudflare.com/?mode=teacher
- 学生端：https://relatively-trout-through-traditional.trycloudflare.com/?mode=student

**Localtunnel 备用**

- 老师端：https://khaki-phones-bake.loca.lt/?mode=teacher
- 若出现提醒页，按页面提示继续即可

> 隧道会过期/换域名。打不开时不要死磕公网链接，请改用上面的「本机一键启动」。

云端 Agent 页（聊天，不是课堂页）：https://cursor.com/agents/bc-c04c08a6-a313-481a-af1f-cece7532f9c7

---

## 本机仍打不开时排查

1. 终端是否还在跑 `node server.mjs`（关掉窗口 = 服务停了）
2. 浏览器打开 http://127.0.0.1:3000/__gy/health 应看到 `{"ok":true,...}`
3. 3000 被占用时：`set PORT=3001`（Windows）或 `PORT=3001 npm start`
4. 手机打不开：必须同一 Wi‑Fi；关掉电脑「访客网络隔离」；不要用 `127.0.0.1` 生成的码
5. 可选公网（本机另开终端）：`npm run tunnel`，把新地址填进「手机扫码地址」
