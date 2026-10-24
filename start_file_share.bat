@echo off
title 文件共享 API 服务
cd /d "%~dp0"

echo ==========================================
echo         文件共享 API 服务启动脚本
echo ==========================================

:: 检查 venv 是否存在
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] 虚拟环境不存在，正在创建...
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] 安装依赖...
    pip install flask flask-cors
) else (
    call venv\Scripts\activate.bat
)

echo.
echo [INFO] 启动文件共享服务器...
echo [INFO] 按 Ctrl+C 停止服务
echo ==========================================
echo.

python file_share_server.py

pause
