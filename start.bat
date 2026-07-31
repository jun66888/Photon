@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 本机课堂（稳定模式）

echo.
echo  ========================================
echo   光影盟 · 本机课堂启动
echo   不依赖公网隧道 · 地址固定 · 断网可用
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

echo  使用说明：
echo    1. 电脑连教室 Wi-Fi（与学生手机同一网络）
echo    2. 本窗口保持打开 = 课堂服务在线
echo    3. 老师端会自动打开；扫码请用窗口里的「固定扫码」地址
echo    4. 首次建议再双击「开放防火墙.bat」一次（允许手机访问）
echo    5. 若 IP 经常变：给电脑设静态 IP，二维码可长期不变
echo.
echo  电脑打开： http://localhost:3000/?mode=teacher
echo  按 Ctrl+C 可停止；异常退出会自动重试
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/?mode=teacher"

:loop
node server.mjs
set EXITCODE=%ERRORLEVEL%
if "%EXITCODE%"=="0" goto end
echo.
echo  [提示] 服务退出（代码 %EXITCODE%），3 秒后自动重启…
echo  若提示端口占用，可关闭其它占用 3000 的程序，或：
echo    set PORT=3001 ^&^& node server.mjs
echo.
timeout /t 3 /nobreak >nul
goto loop

:end
echo.
echo  服务已停止。
pause
