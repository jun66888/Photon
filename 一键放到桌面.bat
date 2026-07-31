@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 一键放到桌面

set "ROOT=%CD%"
set "DESKTOP="

if exist "%USERPROFILE%\Desktop\" set "DESKTOP=%USERPROFILE%\Desktop"
if not defined DESKTOP if exist "%USERPROFILE%\OneDrive\Desktop\" set "DESKTOP=%USERPROFILE%\OneDrive\Desktop"
if not defined DESKTOP if exist "%PUBLIC%\Desktop\" set "DESKTOP=%PUBLIC%\Desktop"

if not defined DESKTOP (
  echo  [错误] 找不到桌面文件夹。
  pause
  exit /b 1
)

echo.
echo  仓库目录: %ROOT%
echo  桌面目录: %DESKTOP%
echo  正在创建常用入口…
echo.

REM ---- 开始上课（主入口：启动服务）----
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo cd /d "%ROOT%"
  echo call "%ROOT%\start.bat"
) > "%DESKTOP%\光影盟-开始上课.bat"

REM ---- 打开老师端（需已开始上课）----
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo start "" "http://127.0.0.1:3000/?mode=teacher"
) > "%DESKTOP%\光影盟-打开老师端.bat"

REM ---- 固定收藏地址说明 ----
(
  echo 光影盟 · 请收藏老师端（永远不变^）
  echo.
  echo http://127.0.0.1:3000/?mode=teacher
  echo.
  echo 上课前：双击桌面「光影盟-开始上课」
  echo 然后打开上面地址，或双击「光影盟-打开老师端」
  echo.
  echo 程序目录：
  echo %ROOT%
  echo.
  echo 手机扫码地址见程序目录里的「固定访问地址.txt」
  echo （首次连教室 Wi-Fi 并开始上课后自动生成并锁定^）
) > "%DESKTOP%\光影盟-收藏地址.txt"

REM ---- 绑定扫码（可选）----
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo cd /d "%ROOT%"
  echo call "%ROOT%\绑定课堂扫码地址.bat"
) > "%DESKTOP%\光影盟-绑定扫码地址.bat"

REM ---- 开放防火墙（首次一次）----
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo cd /d "%ROOT%"
  echo call "%ROOT%\开放防火墙.bat"
) > "%DESKTOP%\光影盟-开放防火墙.bat"

echo  [完成] 已放到桌面：
echo    光影盟-开始上课.bat     ^<-- 上课前点这个
echo    光影盟-打开老师端.bat
echo    光影盟-收藏地址.txt
echo    光影盟-绑定扫码地址.bat
echo    光影盟-开放防火墙.bat
echo.
echo  老师端固定地址（请收藏）：
echo    http://127.0.0.1:3000/?mode=teacher
echo.
pause
