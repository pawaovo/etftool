@echo off
echo 正在创建本地版HTML文件...
echo.

rem 检查Node.js是否已安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: Node.js未安装
    echo 请先安装Node.js，然后再运行此脚本
    echo 您可以从 https://nodejs.org/ 下载Node.js
    echo.
    pause
    exit /b 1
)

rem 运行脚本创建本地版HTML
node local-version-creator.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo 创建本地版HTML文件时出错
    pause
    exit /b 1
)

echo.
echo 本地版HTML文件创建成功!
echo 您可以直接双击打开 150plan-local.html 文件
echo 无需启动Web服务器，可通过file://协议访问

rem 尝试自动打开生成的HTML文件
choice /c yn /m "是否立即打开生成的本地版HTML文件? (Y/N)" /t 10 /d y
if %ERRORLEVEL% equ 1 (
    start 150plan-local.html
)

echo.
pause 