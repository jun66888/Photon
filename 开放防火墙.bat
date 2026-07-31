@echo off
chcp 65001 >nul
title 光影盟 · 开放本机防火墙端口
cd /d "%~dp0"

echo.
echo  将允许手机通过局域网访问本机 3000 端口（光影盟课堂）。
echo  需要管理员权限；只需在本教室电脑运行一次。
echo.
net session >nul 2>&1
if errorlevel 1 (
  echo  [提示] 当前不是管理员，正在请求提权…
  powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

netsh advfirewall firewall delete rule name="光影盟课堂3000" >nul 2>&1
netsh advfirewall firewall add rule name="光影盟课堂3000" dir=in action=allow protocol=TCP localport=3000 profile=private,domain
if errorlevel 1 (
  echo  [错误] 添加防火墙规则失败。
  pause
  exit /b 1
)

echo  [完成] 已允许 TCP 3000 入站（专用/域网络）。
echo  请确认：
echo    - 电脑与手机连同一 Wi-Fi
echo    - 已双击 start.bat 启动课堂
echo    - 用窗口打印的「固定扫码」地址测试手机浏览器能否打开
echo.
pause
