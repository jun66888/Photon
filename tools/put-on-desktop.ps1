# 光影盟：把常用入口写到当前用户桌面
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$Desk = [Environment]::GetFolderPath("Desktop")
if (-not $Desk -or -not (Test-Path $Desk)) {
  throw "找不到桌面文件夹"
}

$utf8 = New-Object System.Text.UTF8Encoding $true
function Write-Desk([string]$Name, [string]$Content) {
  $path = Join-Path $Desk $Name
  [System.IO.File]::WriteAllText($path, $Content, $utf8)
  Write-Host "  + $path"
}

Write-Host ""
Write-Host "程序目录: $Root"
Write-Host "桌面目录: $Desk"
Write-Host "正在写入..."
Write-Host ""

$startBat = @"
@echo off
chcp 65001 >nul
cd /d "$Root"
call "$Root\start.bat"
"@

$teacherBat = @"
@echo off
chcp 65001 >nul
start "" "http://127.0.0.1:3000/?mode=teacher"
"@

$bindBat = @"
@echo off
chcp 65001 >nul
cd /d "$Root"
call "$Root\绑定课堂扫码地址.bat"
"@

$fwBat = @"
@echo off
chcp 65001 >nul
cd /d "$Root"
call "$Root\开放防火墙.bat"
"@

$urlTxt = @"
光影盟 · 请收藏老师端（永远不变）

http://127.0.0.1:3000/?mode=teacher

上课前：双击桌面「光影盟-开始上课」或 GY-Start
程序目录：
$Root

手机扫码见程序目录「固定访问地址.txt」
"@

Write-Desk "光影盟-开始上课.bat" $startBat
Write-Desk "GY-Start.bat" $startBat
Write-Desk "光影盟-打开老师端.bat" $teacherBat
Write-Desk "GY-Teacher.bat" $teacherBat
Write-Desk "光影盟-收藏地址.txt" $urlTxt
Write-Desk "光影盟-绑定扫码地址.bat" $bindBat
Write-Desk "光影盟-开放防火墙.bat" $fwBat

Write-Host ""
Write-Host "[完成] 桌面已写入。正在打开桌面文件夹..."
Start-Process explorer.exe $Desk
