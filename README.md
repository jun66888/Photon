# 光影盟 · 联盟积分体系

纯前端单页应用，**优先在本地运行**：老师投屏看板、学生投票、课堂签到、毕业回忆。

未填写 Firebase 时自动进入 **DEMO 本地模式**（数据存在浏览器 `localStorage`），本机即可完整体验。配置 Firebase 后，同一局域网内多设备可实时同步。

---

## 马上预览

云端已装好依赖并启动服务时，请看 [`PREVIEW.md`](PREVIEW.md) 里的公网链接（`*.trycloudflare.com`）。

## 本地部署（你自己的电脑）

### 1. 拉取并安装依赖（一次性）

```bash
git clone https://github.com/jun66888/Photon.git
cd Photon
git checkout cursor/guangyingmeng-arena-f9c7
npm install
```

需要：[Node.js 18+](https://nodejs.org/)（安装后自带 `npm`）。

### 2. 启动

```bash
npm start
```

或 Windows 双击 `start.bat` / macOS·Linux 执行 `./start.sh`。

无 Node 时可用：`python -m http.server 3000`

### 3. 浏览器打开

| 端 | 地址 |
|----|------|
| 老师端（默认） | http://localhost:3000/?mode=teacher |
| 学生端 | http://localhost:3000/?mode=student |
| 签到端 | http://localhost:3000/?mode=checkin&code=老师生成的码 |
| 毕业回忆 | http://localhost:3000/?mode=memories |

左上角 **DEMO · 本地模式** = 未接 Firebase，数据在本机浏览器，界面可完整体验。

手机同 Wi-Fi 访问电脑局域网 IP，例如 `http://192.168.1.8:3000/?mode=student`。

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `index.html` | 全部 UI + 业务逻辑（内嵌 CSS/JS） |
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
