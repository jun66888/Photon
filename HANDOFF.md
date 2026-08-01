# 光影盟课堂系统 · 对接说明（给试听课 / 其他 Agent）

> 把本文整段发给正在做「试听课」的 GPT / Agent，即可对齐仓库、入口与可融合点。

## 这是什么

仓库：**https://github.com/jun66888/Photon**  
当前功能分支：`cursor/guangyingmeng-arena-f9c7`  
主 PR：https://github.com/jun66888/Photon/pull/6  

正在维护本系统的 Cursor Cloud Agent：  
https://cursor.com/agents/bc-c04c08a6-a313-481a-af1f-cece7532f9c7  

产品名：**光影盟 · 联盟积分 / 课堂投屏系统**（老师投屏 + 学生扫码）。

## 本地路径与启动

```bash
git clone -b cursor/guangyingmeng-arena-f9c7 https://github.com/jun66888/Photon.git /Users/liwei/Photon
cd /Users/liwei/Photon
git checkout cursor/guangyingmeng-arena-f9c7
npm install
npm start
```

| 端 | URL |
|----|-----|
| 老师投屏 | `http://localhost:3000/?mode=teacher` |
| 学生端 | `http://localhost:3000/?mode=student` |
| 签到 | `http://localhost:3000/?mode=checkin&code=老师生成的6位码` |
| 毕业回忆 | `http://localhost:3000/?mode=memories` |

核心文件几乎全在单页：`index.html`（CSS + JS 内嵌）。  
本地静态服务 + DEMO 跨设备同步：`server.mjs`（`/__gy/demo-db`、`/__gy/net.json`）。

## 已有能力（勿重复造轮子）

- 左右轨布局：左导航 / 右**道具栏（卡槽）**
- 门派任务条：可折叠横向滚动 → 点卡进任务详情
- 签到二维码、抽人、投票、兑换、加分（含幸运加分）、拳皇音效包
- 道具库存：`config.camp_inventory_red/blue`、`peaks/*/inventory`、`disciples/*/inventory`
- DEMO 模式：无 Firebase 时用 localStorage；`npm start` 下手机签到经 `/__gy/demo-db` 同步到老师端

## 建议融合方式（试听课）

1. **同仓同分支协作**：试听课流程做成 `index.html` 内新 `mode=` 或老师端新 `subview`，复用现有弟子 / 积分 / 道具 / 签到数据，不要另起一套学员表。
2. **入口建议**：
   - 老师：`?mode=teacher` 左轨加「试听」→ `setTeacherView("trial")`
   - 学员：`?mode=trial` 或复用 `student` / `checkin`
3. **数据写入约定**：用现有 `setPath` / `updatePaths`；加分走 `addScoreToDisciple` / 山峰加分；发道具写入对应 `inventory` 并调用 `renderPropRail()`。
4. **视觉**：沿用 CSS 变量（`--gold`、`--font-brush`、`--panel` 等）与 `course-page` / `course-hero` 结构，避免另起一套 UI。

## 请对方 Agent 回传的信息

为打通融合，请回复：

1. 试听课需要哪些页面 / 步骤  
2. 是否复用签到学号与弟子名册  
3. 奖励是加分、发道具，还是独立徽章  
4. 希望挂在老师左轨还是独立 `mode=`

然后在本分支直接改 `index.html`，或开 `cursor/trial-lesson-xxxx` 分支再 PR 合并到 `cursor/guangyingmeng-arena-f9c7`。
