# 预览说明

## 当前云端预览（已装好并已启动）

环境内已安装 Node.js、`serve`、`cloudflared`，静态服务跑在 `4173`，并开了公网隧道。

**请直接点开：**

- 老师端：https://freight-rocks-ourselves-transcription.trycloudflare.com/?mode=teacher  
- 学生端：https://freight-rocks-ourselves-transcription.trycloudflare.com/?mode=student  
- 毕业回忆：https://freight-rocks-ourselves-transcription.trycloudflare.com/?mode=memories  

> 隧道地址在 Agent 重启后会变化；若打不开，在本仓库再执行 `npm run preview`，并用 `cloudflared tunnel --url http://127.0.0.1:4173` 重新取链接。

## 你自己电脑上跑

```bash
git clone https://github.com/jun66888/Photon.git
cd Photon
git checkout cursor/guangyingmeng-arena-f9c7
npm install
npm start
```

浏览器打开：http://localhost:3000/?mode=teacher
