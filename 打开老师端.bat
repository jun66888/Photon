@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 打开老师端
REM 永久固定地址，请收藏；服务需已运行（先双击 start.bat）
start "" "http://127.0.0.1:3000/?mode=teacher"
