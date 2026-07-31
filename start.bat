@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 本地课堂服务

echo.
echo  ========================================
echo   光影盟 · 本机启动（不依赖外网）
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [错误] 未检测到 Node.js
  echo  请先安装：https://nodejs.org （选 LTS）
  echo  安装后重新双击本文件。
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo  首次运行，正在 npm install …
  call npm install
  if errorlevel 1 (
    echo  [错误] npm install 失败
    pause
    exit /b 1
  )
)

echo  启动后自动打开老师端：
echo    http://localhost:3000/?mode=teacher
echo  手机请用窗口里打印的「手机同网」地址（不要扫 localhost）
echo  按 Ctrl+C 可停止服务
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/?mode=teacher"
node server.mjs
if errorlevel 1 (
  echo.
  echo  [错误] 服务启动失败。常见原因：3000 端口被占用。
  echo  可改端口：set PORT=3001 ^&^& node server.mjs
  echo.
  pause
)
