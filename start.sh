#!/bin/bash

echo "=========================================="
echo "   穿斗式建筑后端服务启动脚本"
echo "=========================================="
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未检测到Python3，请先安装"
    exit 1
fi

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "[信息] 创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
echo "[信息] 激活虚拟环境..."
source venv/bin/activate

# 安装依赖
echo "[信息] 检查依赖..."
pip install -q -r requirements.txt

# 检查.env文件
if [ ! -f ".env" ]; then
    echo "[信息] 创建环境配置文件..."
    cp .env.example .env
    echo "[警告] 请编辑 .env 文件配置密钥后再启动"
    exit 1
fi

# 启动服务（Render 等平台使用 gunicorn，此处仅用于本地）
PORT_VALUE=${PORT:-5000}
echo ""
echo "=========================================="
echo "   启动 Flask 服务..."
echo "   访问地址: http://localhost:${PORT_VALUE}"
echo "   健康检查: http://localhost:${PORT_VALUE}/health"
echo "=========================================="
echo ""

python run.py
