# 光影盟 · 联盟积分体系

**本机课堂**：老师电脑本地运行；**学生可用手机流量扫码签到**（默认经 Cloudflare 临时隧道）。  
老师端始终收藏 `http://127.0.0.1:3000/?mode=teacher`。同 Wi‑Fi 仍可作备用。

- 字体 / 二维码在 `vendor/`，不请求 CDN  
- 数据经本机 `/__gy/demo-db` 同步（`gy-demo-db.json`）  
- 启动时 `public-tunnel.sh` 写入 `gy-tunnel-origin.json`（流量扫码）；局域网备用见 `gy-classroom.json`  
- 只要局域网、不要隧道：`GY_PUBLIC_TUNNEL=0 ./start.sh`

**请先读：[课堂稳定使用.md](./课堂稳定使用.md)** · **[固定访问地址.md](./固定访问地址.md)**

---

## 老师请收藏（永远不变）

```
http://127.0.0.1:3000/?mode=teacher
```

也可双击 `打开老师端.bat` / `打开老师端.url`。

---

## 启动

需要一次（有网时）：[Node.js 18+](https://nodejs.org/)。之后可断网上课。

- **Windows（推荐）**：本机项目文件夹双击 `一键放到桌面.bat` 或 `PUT-ON-DESKTOP.bat`，之后用桌面 `GY-Start` /「光影盟-开始上课」
- 或直接双击项目里的 `start.bat`（建议先跑一次 `开放防火墙.bat`）
- 说明：云端 Agent **不会**把图标写到你教室电脑桌面，必须在本机双击上述脚本  
- **Mac（本机固定目录）**：`/Users/liwei/Photon`  
  ```bash
  cd /Users/liwei/Photon && ./更新本地.sh && ./一键放到桌面.sh && ./一键上课.sh
  ```
  之后桌面只需双击「光影盟-一键上课」（自动更新+启动+打开启动台）
  启动台：`http://127.0.0.1:3000/launcher.html`
- **Linux**：`./一键上课.sh` 或 `./start.sh` / `npm start`

手机扫码地址首次绑定后写入 `gy-classroom.json`，**不会自动更换**。  
详见 `固定访问地址.txt`（每次启动生成）。

---

## 文件

| 文件 | 说明 |
|------|------|
| `index.html` | UI + 业务（`LOCAL_OFFLINE = true`） |
| `server.mjs` | 本机静态服务 + DEMO 同步 + 固定扫码地址 |
| `vendor/` | 本地字体、二维码库 |
| `start.bat` / `start.sh` | 一键启动（保活） |
| `开放防火墙.bat` | Windows 放行 3000 |
| `课堂稳定使用.md` | 上课操作说明 |

---

## 核心规则摘要

- **山峰段位**：入门 0–500 → 筑基 → 金丹 → 元婴 → 化神 5000+  
- **个人等级**：Lv1–10 每级 300exp，11–20 每级 500，21–30 每级 800  
- **加分同步**：山峰加分时，该峰弟子 `exp += points × 10`，`contributed += points`  
- **擂台额外经验**：金/银/铜 +300 / +200 / +100  
- **天数切换**：积分累计不清零；仅重置票数与签到/投票状态；右侧栏有小组/学员累计排行  
- **段位结算**：设置面板手动触发，阵营内按 `contributed` 排名  

加分日志默认操作员为 `李红星`，可在 `index.html` 里改常量 `OPERATOR`。
