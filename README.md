# 光影盟 · 联盟积分体系

纯前端单页应用，**本机课堂稳定模式**：老师电脑本地运行，手机同一 Wi‑Fi 扫局域网固定地址。  
不依赖公网隧道，断网也能上课。

- 字体 / 二维码在 `vendor/`，默认不请求外网  
- 未填 Firebase → **DEMO 本地模式**（`localStorage` + 本机 `/__gy/demo-db` 跨设备同步）  
- 固定扫码地址写入本机 `gy-classroom.json`，二维码不因临时域名失效  

**正式上课请读：[课堂稳定使用.md](./课堂稳定使用.md)**

---

## 本机启动（推荐，课堂用这个）

需要一次：[Node.js 18+](https://nodejs.org/)（`server.mjs` 只用 Node 内置模块，**不必**每次 `npm install`）。

```bash
git clone https://github.com/jun66888/Photon.git
cd Photon
```

然后：

1. （Windows 建议）双击一次 `开放防火墙.bat`  
2. **Windows**：双击 `start.bat`（自动打开浏览器，异常退出会重启）  
3. **Mac / Linux**：`./start.sh` 或 `npm start`

| 端 | 地址 |
|----|------|
| 老师端 | http://localhost:3000/?mode=teacher |
| 学生端 | http://localhost:3000/?mode=student |
| 签到端 | 用窗口里的 **固定扫码** 局域网地址 + 老师生成的码 |
| 毕业回忆 | http://localhost:3000/?mode=memories |

左上角 **DEMO · 跨设备同步中** = 本机服务正常。  
手机务必用 `http://192.168.x.x:3000`，不要扫 localhost，不要用 trycloudflare。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 全部 UI + 业务逻辑（内嵌 CSS/JS） |
| `vendor/` | 本地字体、二维码、可选 Firebase SDK |
| `server.mjs` | 本机静态服务 + DEMO 同步 + 课堂固定地址 |
| `start.bat` / `start.sh` | 一键启动（保活重启） |
| `开放防火墙.bat` | Windows 允许手机访问 3000 端口 |
| `课堂稳定使用.md` | 正式上课操作说明 |
| `gy-classroom.json` | 本机生成的固定扫码地址（勿提交） |

---

## （可选）接 Firebase 做多端实时同步

仅本机 DEMO 可跳过本节。需要跨公网实时同步时再配置。

1. [Firebase Console](https://console.firebase.google.com/) 创建项目 → 添加 Web 应用  
2. 创建 Realtime Database，开发阶段可用测试规则：

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

3. 编辑 `index.html` 顶部 `FIREBASE_CONFIG`，填入你的 `apiKey`、`databaseURL` 等  
4. 保存后刷新页面；首次打开若 `/arena` 为空会自动写入种子数据  

---

## （可选）部署到 Vercel

本地跑通后再做。把本仓库导入 [Vercel](https://vercel.com)，Framework 选 Other，根目录即静态站点。

```bash
npx vercel --prod
```

注意：Vercel 是公网静态托管，**没有**本机 `/__gy/demo-db` 同步；课堂签到仍建议本机 `start.bat`。

---

## 核心规则摘要

- **山峰段位**：入门 0–500 → 筑基 → 金丹 → 元婴 → 化神 5000+  
- **个人等级**：Lv1–10 每级 300exp，11–20 每级 500，21–30 每级 800  
- **加分同步**：山峰加分时，该峰弟子 `exp += points × 10`，`contributed += points`  
- **擂台额外经验**：金/银/铜 +300 / +200 / +100  
- **天数切换**：不重置积分，仅重置票数与签到/投票状态  
- **段位结算**：设置面板手动触发，阵营内按 `contributed` 排名  

加分日志默认操作员为 `李红星`，可在 `index.html` 里改常量 `OPERATOR`。
