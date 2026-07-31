# 预览说明

## 为什么昨天能扫、今天不能？

临时公网隧道（`*.trycloudflare.com`）**隔天或重启后地址会变**，旧二维码里的链接会失效。  
另外若老师端开在 `localhost`，二维码会写成 `127.0.0.1`，手机微信永远打不开。

## 云端预览（今天有效）

**老师端：** https://postcards-school-seem-specializing.trycloudflare.com/?mode=teacher

**学生端：** https://postcards-school-seem-specializing.trycloudflare.com/?mode=student

> 请硬刷新（Ctrl+F5）后再「生成签到码」。隧道关掉后需重开并换新地址。

## 课堂推荐用法（最稳）

1. 电脑在项目目录执行 `npm start`（或双击 `start.bat`）
2. 看终端里的 **手机同网** 地址（形如 `http://192.168.x.x:3000`）
3. 用该地址打开老师端 → 签到 → 生成签到码  
4. 二维码会自动尽量避开 localhost；也可在上方「手机扫码地址」粘贴后点「应用到二维码」
5. **扫不开时**：让学生用手机浏览器打开同一「手机同网」地址，进入签到页后 **手输投屏上的 6 位黄色大号数字**

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
