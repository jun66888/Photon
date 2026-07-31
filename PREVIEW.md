# 预览地址

## 推荐：本机打开（课堂主用）

在仓库目录执行：

```bash
npm start
```

Windows 也可双击 `start.bat`。浏览器打开提示的本机地址（一般是 `http://127.0.0.1:3000/`）。

同 Wi‑Fi 下手机签到：用终端打印的局域网地址生成二维码（不要用 Cloud Agent 里的 `localhost`）。

## 备用：临时公网隧道（本机无法同网时）

当前 Cloud Agent 临时公网（会失效，需重新开隧道）：

- 教师端：[https://lower-decor-breathing-rocks.trycloudflare.com/](https://lower-decor-breathing-rocks.trycloudflare.com/)
- 签到页：[https://lower-decor-breathing-rocks.trycloudflare.com/?view=checkin](https://lower-decor-breathing-rocks.trycloudflare.com/?view=checkin)

说明：临时隧道经常过期；课堂请优先本机 `npm start`，隧道只作备用。
