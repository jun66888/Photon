# 光影盟 · 联盟积分体系

纯前端单页应用：老师投屏看板、学生投票、课堂签到、毕业回忆。数据通过 **Firebase Realtime Database** 实时同步，可一键部署到 **Vercel**。

未填写 Firebase 配置时，会自动进入 **本地 DEMO 模式**（`localStorage`），便于先预览界面与交互。

## 文件

| 文件 | 说明 |
|------|------|
| `index.html` | 全部 UI + 业务逻辑（内嵌 CSS/JS） |
| `vercel.json` | Vercel 静态路由，保证 `?mode=` 可用 |

## 四种模式

| URL | 用途 |
|-----|------|
| `/?mode=teacher`（默认） | 老师端：积分榜、加分、签到投屏、投票、设置 |
| `/?mode=student` | 学生端：投票与排行榜 |
| `/?mode=checkin&code=XXXXXX` | 签到端（扫老师二维码） |
| `/?mode=memories` | 毕业回忆（Day ≥ 20 从老师端进入） |

## Firebase 配置

1. 打开 [Firebase Console](https://console.firebase.google.com/) 创建项目  
2. 添加 Web 应用，复制配置  
3. 创建 **Realtime Database**，先用测试规则（开发用）：

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. 编辑 `index.html` 顶部的 `FIREBASE_CONFIG`：

```js
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

首次打开老师端时，若 `/arena` 为空会自动写入种子数据（5 座山峰、25 名弟子、13 个加分预设、3 条任务）。

> 前端配置本身会暴露，请勿在库里存放敏感业务密钥；上线前请收紧 RTDB 规则。

## 本地预览

```bash
npx --yes serve -l 3000 .
# 浏览器打开 http://localhost:3000/?mode=teacher
```

## 部署到 Vercel

1. 将本仓库导入 [Vercel](https://vercel.com)  
2. Framework Preset 选 Other，输出目录为仓库根目录  
3. 部署后把线上域名填进老师端投屏场景即可生成签到/投票二维码  

也可使用 CLI：

```bash
npx vercel --prod
```

## 核心规则摘要

- **山峰段位**：入门 0–500 → 筑基 → 金丹 → 元婴 → 化神 5000+  
- **个人等级**：Lv1–10 每级 300exp，11–20 每级 500，21–30 每级 800  
- **加分同步**：山峰加分时，该峰弟子 `exp += points × 10`，`contributed += points`  
- **擂台额外经验**：金/银/铜 +300 / +200 / +100  
- **天数切换**：不重置积分，仅重置票数与签到/投票状态  
- **段位结算**：设置面板手动触发，阵营内按 `contributed` 排名  

## 操作员

加分日志默认 `operator: "李红星"`，可在 `index.html` 中修改常量 `OPERATOR`。
