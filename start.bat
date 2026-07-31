@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 本机离线课堂

echo.
echo  ========================================
echo   光影盟 · 本机离线课堂
echo   无需外网 · 学生现场局域网即可
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

echo  上课步骤：
echo    1. 电脑连教室 Wi-Fi（可无外网；与学生同一网络）
echo    2. 本窗口保持打开
echo    3. 老师端自动打开；扫码用窗口里的「固定扫码」地址
echo    4. 首次建议双击「开放防火墙.bat」一次
echo    5. 建议给电脑设静态 IP，二维码长期不变
echo.
echo  电脑打开： http://localhost:3000/?mode=teacher
echo  按 Ctrl+C 停止；异常退出会自动重试
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000/?mode=teacher"

:loop
node server.mjs
set EXITCODE=%ERRORLEVEL%
if "%EXITCODE%"=="0" goto end
echo.
echo  [提示] 服务退出（代码 %EXITCODE%），3 秒后自动重启…
echo  若端口占用：关闭其它程序，或 set PORT=3001 ^&^& node server.mjs
echo.
timeout /t 3 /nobreak >nul
goto loop

:end
echo.
echo  服务已停止。
pause
