@echo off
title Backend Server
cd /d "%~dp0"

if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating virtual environment...
    py -m venv venv
    call venv\Scripts\activate.bat
    
    echo [INFO] Upgrading pip...
    py -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple/
    
    echo [INFO] Installing dependencies via Tsinghua Mirror...
    pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
) else (
    call venv\Scripts\activate.bat
)

echo.
echo [INFO] Starting backend server...
py run.py

pause