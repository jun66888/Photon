# 光影盟 · 联盟积分体系

**本机离线课堂**：老师电脑本地运行，学生现场同一 Wi‑Fi/局域网使用。  
**无需外网**——教室断网也能签到、投票、抽人、加分、兑换。

- 字体 / 二维码在 `vendor/`，不请求 CDN  
- 数据经本机 `/__gy/demo-db` 同步（`gy-demo-db.json`）  
- 扫码地址锁定在 `gy-classroom.json`（局域网，非公网隧道）  

**请先读：[课堂稳定使用.md](./课堂稳定使用.md)**

---

## 启动

需要一次（有网时）：[Node.js 18+](https://nodejs.org/)。之后可断网上课。

- **Windows**：双击 `start.bat`（建议先跑一次 `开放防火墙.bat`）  
- **Mac / Linux**：`./start.sh` 或 `npm start`

| 端 | 地址 |
|----|------|
| 老师端 | http://localhost:3000/?mode=teacher |
| 学生端 | http://localhost:3000/?mode=student |
| 签到 | 用窗口打印的 **固定扫码** 局域网地址 |

手机不要扫 `localhost`，不要用任何 trycloudflare / 公网链接。

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
- **天数切换**：不重置积分，仅重置票数与签到/投票状态  
- **段位结算**：设置面板手动触发，阵营内按 `contributed` 排名  

加分日志默认操作员为 `李红星`，可在 `index.html` 里改常量 `OPERATOR`。
