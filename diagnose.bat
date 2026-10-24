@echo off
echo ====================================
echo  登录问题诊断脚本
echo ====================================
echo.

cd /d "%~dp0"

echo [1] 检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] Python未安装或未添加到PATH
    echo 请安装Python 3.8+ 并确保添加到系统PATH
    pause
    exit /b 1
)

echo [2] 检查后端依赖...
pip show flask flask-sqlalchemy flask-jwt-extended >nul 2>&1
if errorlevel 1 (
    echo [警告] 部分依赖未安装，正在安装...
    pip install -r requirements.txt -q
)

echo [3] 检查数据库...
python check_db.py

echo.
echo [4] 运行诊断...
python diagnose_login.py

echo.
echo ====================================
echo  诊断完成
echo ====================================
echo.
echo 提示: 
echo   1. 确保后端服务器已启动: python run.py
echo   2. 打开 diagnose_login.html 进行浏览器端诊断
echo   3. 在浏览器控制台查看详细日志
echo.
pause
