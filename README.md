# 光影盟 · 联盟积分体系

纯前端单页应用，**优先在本地运行**：老师投屏看板、学生投票、课堂签到、毕业回忆。

未填写 Firebase 时自动进入 **DEMO 本地模式**（数据存在浏览器 `localStorage`），本机即可完整体验。配置 Firebase 后，同一局域网内多设备可实时同步。

---

## 本地部署（推荐）

### 环境要求

- 已安装 [Node.js](https://nodejs.org/)（建议 18+，自带 `npx`）
- 或任意静态服务器（Python / VS Code Live Server 等）

### 1. 拉取代码

```bash
git clone https://github.com/jun66888/Photon.git
cd Photon
git checkout cursor/guangyingmeng-arena-f9c7
```

也可以只下载本分支里的 `index.html`，单独放到一个空文件夹。

### 2. 启动本地服务

**方式 A：一键脚本**

- Windows：双击 `start.bat`
- macOS / Linux：

```bash
chmod +x start.sh
./start.sh
```

**方式 B：npm**

```bash
npm start
```

**方式 C：Python（无 Node 时）**

```bash
# Python 3
python -m http.server 3000
```

### 3. 浏览器打开

| 端 | 地址 |
|----|------|
| 老师端（默认） | http://localhost:3000/?mode=teacher |
| 学生端 | http://localhost:3000/?mode=student |
| 签到端 | http://localhost:3000/?mode=checkin&code=老师生成的码 |
| 毕业回忆 | http://localhost:3000/?mode=memories |

左上角若显示 **DEMO · 本地模式**，说明当前未接 Firebase，加分等操作仍可用，数据只保存在本机浏览器。

### 手机连同一台电脑（局域网）

1. 电脑与手机连同一个 Wi-Fi  
2. 查电脑局域网 IP（如 `192.168.1.8`）  
3. 手机访问：`http://192.168.1.8:3000/?mode=student`  
4. 签到二维码也会自动用当前访问的主机名生成  

> 不要用云端 Agent 里的 `localhost`，那是远程虚拟机地址，你本机打不开。

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
