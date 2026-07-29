# 预览说明

## 云端预览（已启动）

依赖与服务已装好。公网隧道：

**https://freight-rocks-ourselves-transcription.trycloudflare.com/?mode=teacher**

若链接失效，在仓库目录执行：

```bash
npm run preview
# 另开终端
cloudflared tunnel --url http://127.0.0.1:4173 --no-autoupdate
```

## 本机

```bash
npm install
npm start
# http://localhost:3000/?mode=teacher
```

## 本次武侠改版要点

- 活页纸 / 金庸群侠传风 UI（宣纸纹、印章、毛笔标题）
- 两大联盟分栏，门派牌可 **拖拽换阵营 / 调序**，可增减门派与弟子
- 点击门派 → 弹层：**加分招式 / 属性编辑 / 弟子名册**
- 属性含：Logo、队长、口号、绝学、驻地、简介等
- 山峰列表固定按积分高低排序（无需手动切换）
- 加分特效加强（墨爆、震屏、金光粒子）
- 音效：仙剑奇侠传 3 气质合成（剑气 / 灵力 / 琴笛）；可「导入音效包」使用本地采样（仓库不附带正版资源）
