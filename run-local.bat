@echo off
echo 正在启动简易Web服务器...
echo.

rem 尝试使用Python启动服务器
where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo 使用Python启动服务器...
    start http://localhost:8000
    python -m http.server 8000
    goto :end
)

where python3 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo 使用Python3启动服务器...
    start http://localhost:8000
    python3 -m http.server 8000
    goto :end
)

rem 如果没有Python，尝试使用Node.js
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo 使用Node.js启动服务器...
    start http://localhost:3000
    node serve.js
    goto :end
)

echo 错误: 未找到Python或Node.js
echo 请安装Python或Node.js后再尝试
echo.
echo 或者您可以直接通过Web服务器访问这些文件
echo 比如使用XAMPP、Nginx或Apache等

:end
pause 