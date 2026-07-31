@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 本机课堂（断网可用）

echo.
echo  ========================================
echo   光影盟 · 本机启动（主用，不依赖公网）
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [错误] 未检测到 Node.js
  echo  请先安装一次：https://nodejs.org （选 LTS）
  echo  安装后重新双击本文件。无需每次联网。
  echo.
  pause
  exit /b 1
)

echo  即将打开老师端（仅本机，断网也能用）：
echo    http://localhost:3000/?mode=teacher
echo  手机同 Wi-Fi：看下方窗口打印的「手机同网」地址
echo  公网隧道仅作备用，课堂请用本机地址。
echo  按 Ctrl+C 可停止
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/?mode=teacher"
node server.mjs
if errorlevel 1 (
  echo.
  echo  [错误] 启动失败。若提示端口占用，可执行：
  echo    set PORT=3001 ^&^& node server.mjs
  echo.
  pause
)
