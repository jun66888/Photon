@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 本机离线课堂

echo.
echo  ========================================
echo   光影盟 · 本机离线课堂
echo   地址永久固定 · 无需外网
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo  [错误] 未检测到 Node.js
  echo  请先在有网时安装一次：https://nodejs.org （选 LTS）
  echo  装好后可完全断网上课。
  echo.
  pause
  exit /b 1
)

echo  【请收藏老师端地址 · 永远不变】
echo    http://127.0.0.1:3000/?mode=teacher
echo.
echo  上课：
echo    1. 电脑连教室 Wi-Fi（可无外网）
echo    2. 本窗口保持打开
echo    3. 浏览器会打开上面的固定地址
echo    4. 手机扫码地址见「固定访问地址.txt」（锁定后不自动换）
echo    5. 首次建议双击「开放防火墙.bat」
echo.
echo  按 Ctrl+C 停止；异常退出会自动重试
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:3000/?mode=teacher"

:loop
node server.mjs
set EXITCODE=%ERRORLEVEL%
if "%EXITCODE%"=="0" goto end
echo.
echo  [提示] 服务退出（代码 %EXITCODE%），3 秒后自动重启…
echo  端口请保持 3000，不要改，否则收藏地址会失效。
echo.
timeout /t 3 /nobreak >nul
goto loop

:end
echo.
echo  服务已停止。
pause
