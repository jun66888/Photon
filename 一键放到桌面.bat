@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 一键放到桌面

echo.
echo  ========================================
echo   必须在「你自己的 Windows 电脑」上双击本文件
echo   （Cloud Agent / 网页环境不会出现在你的桌面）
echo  ========================================
echo.
echo  程序目录: %CD%
echo.

if not exist "%~dp0tools\put-on-desktop.ps1" (
  echo  [错误] 缺少 tools\put-on-desktop.ps1
  echo  请确认已下载/更新完整项目文件夹。
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\put-on-desktop.ps1"
if errorlevel 1 (
  echo.
  echo  [失败] 自动写入桌面失败。
  echo  请手动：把本目录的 start.bat 复制到桌面，改名为「光影盟-开始上课.bat」
  echo.
  pause
  exit /b 1
)

echo.
echo  请看桌面：光影盟-开始上课.bat  或  GY-Start.bat
echo  老师端收藏：http://127.0.0.1:3000/?mode=teacher
echo.
pause
