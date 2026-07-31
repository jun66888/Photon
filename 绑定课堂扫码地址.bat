@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 光影盟 · 绑定扫码地址

echo.
echo  将把「当前电脑局域网 IP」永久绑定为手机扫码地址。
echo  绑定后不会自动更换；老师端收藏地址始终是：
echo    http://127.0.0.1:3000/?mode=teacher
echo.
echo  请确认：已双击 start.bat 且服务正在运行，电脑已连教室 Wi-Fi。
echo.
pause

curl -sS -X POST "http://127.0.0.1:3000/__gy/classroom" -H "Content-Type: application/json" -d "{\"rebind\":true}"
echo.
echo.
echo  绑定结果见上方；详情打开「固定访问地址.txt」
echo.
pause
