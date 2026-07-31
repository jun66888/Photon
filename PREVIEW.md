# 预览说明

## 为什么昨天能扫、今天不能？

临时公网隧道（`*.trycloudflare.com`）**隔天或重启后地址会变**，旧二维码里的链接会失效。  
另外若老师端开在 `localhost`，二维码会写成 `127.0.0.1`，手机微信永远打不开。

## 云端预览（当前有效）

**老师端：** https://relatively-trout-through-traditional.trycloudflare.com/?mode=teacher

**学生端：** https://relatively-trout-through-traditional.trycloudflare.com/?mode=student

> 请硬刷新（Ctrl+F5）后再「生成签到码」。隧道关掉后需重开并换新地址。

## 真正的本机地址（你自己的电脑）

云端 Agent 里的 `localhost:3000` **不是**你电脑上的地址。要在自己电脑打开：

```bash
cd Photon
git checkout cursor/guangyingmeng-arena-f9c7
git pull
npm install
npm start
```

然后浏览器打开：

- 老师端：http://localhost:3000/?mode=teacher
- 手机同 Wi-Fi：终端打印的 `http://192.168.x.x:3000/?mode=teacher`

## 本机排查

```bash
npm install
npm start
# 电脑: http://localhost:3000/?mode=teacher
# 手机: 终端打印的 http://192.168.x.x:3000/?mode=teacher
```

可选公网隧道：

```bash
npm start
# 另开终端
npm run tunnel
# 把新的 https://xxxx.trycloudflare.com 填进「手机扫码地址」
```
