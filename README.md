# 光影盟 · 联盟积分体系

纯前端单页应用，**本机主用、断网可用**；公网隧道只作临时预览备用。

- 字体 / 二维码在 `vendor/`，默认不请求外网
- 未填 Firebase → **DEMO 本地模式**（`localStorage` + 本机 `/__gy/demo-db` 跨设备同步）
- 手机与电脑同一 Wi‑Fi，用局域网 IP 扫码即可，不必开公网

---

## 本机启动（推荐，课堂用这个）

需要一次：[Node.js 18+](https://nodejs.org/)（`server.mjs` 只用 Node 内置模块，**不必**每次 `npm install`）。

```bash
git clone https://github.com/jun66888/Photon.git
cd Photon
git checkout cursor/guangyingmeng-arena-f9c7
git pull
```

然后：

- **Windows**：双击 `start.bat`（会自动打开浏览器）
- **Mac / Linux**：`./start.sh` 或 `npm start`

| 端 | 地址 |
|----|------|
| 老师端 | http://localhost:3000/?mode=teacher |
| 学生端 | http://localhost:3000/?mode=student |
| 签到端 | http://localhost:3000/?mode=checkin&code=老师生成的码 |
| 毕业回忆 | http://localhost:3000/?mode=memories |

左上角 **DEMO · 跨设备同步中** = 本机服务正常。手机用终端打印的 `http://192.168.x.x:3000`，不要扫 localhost。

公网临时预览见 [`PREVIEW.md`](PREVIEW.md)（网络不稳时可能挂，正式上课请本机）。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 全部 UI + 业务逻辑（内嵌 CSS/JS） |
| `vendor/` | 本地字体、二维码、可选 Firebase SDK |
| `package.json` | `npm start` 本地静态服务 |
| `start.bat` / `start.sh` | Windows / Unix 一键启动 |
| `vercel.json` | 可选：以后要上 Vercel 时用 |

---

## （可选）接 Firebase 做多端实时同步

仅本机 DEMO 可跳过本节。需要老师电脑 + 学生手机实时同步时再配置。

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

---

## 核心规则摘要

- **山峰段位**：入门 0–500 → 筑基 → 金丹 → 元婴 → 化神 5000+  
- **个人等级**：Lv1–10 每级 300exp，11–20 每级 500，21–30 每级 800  
- **加分同步**：山峰加分时，该峰弟子 `exp += points × 10`，`contributed += points`  
- **擂台额外经验**：金/银/铜 +300 / +200 / +100  
- **天数切换**：不重置积分，仅重置票数与签到/投票状态  
- **段位结算**：设置面板手动触发，阵营内按 `contributed` 排名  

加分日志默认操作员为 `李红星`，可在 `index.html` 里改常量 `OPERATOR`。
