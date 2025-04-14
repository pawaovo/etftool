@echo off
echo 正在启动ETF工具本地Web服务器...
echo.
echo 如果Node.js尚未安装，请访问 https://nodejs.org/ 下载并安装
echo.

:: 检查Node.js是否已安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误: 未检测到Node.js安装
    echo 请先安装Node.js后再运行此脚本
    echo.
    pause
    exit /b 1
)

:: 启动服务器
echo 正在启动服务器...
node serve.js

:: 如果服务器异常终止，等待用户按键
pause 