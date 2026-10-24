"""
应用启动入口

部署说明：
- 生产启动：gunicorn --bind 0.0.0.0:$PORT run:app
- 本地启动：python run.py
"""
import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import render_template
from sqlalchemy import text
from app import create_app, db
from app.models import User, Post, Comment, Like, GameRecord, Component
from app.utils.env import load_local_env

# 本地开发可选加载 .env；云端由平台注入环境变量
load_local_env()

# 创建应用实例
app = create_app(os.getenv('FLASK_ENV', 'development'))


# 可选：启动前建表（由 INIT_DB_ON_START=true 开启，供免费用法使用）
if os.getenv('INIT_DB_ON_START', '').strip().lower() in ('1', 'true', 'yes', 'on'):
    with app.app_context():
        db.create_all()


@app.route('/health')
def health():
    """
    Render 健康检查：只做轻量查询，需在 5 秒内返回。
    数据库不可用返回 503，避免平台把流量切到异常实例。
    """
    try:
        db.session.execute(text('SELECT 1'))
    except Exception as exc:  # 日志中不输出完整连接串
        app.logger.error('健康检查数据库失败: %s', exc)
        return {
            'status': 'unhealthy',
            'service': 'chuandou-api',
            'database': 'error',
        }, 503

    return {
        'status': 'ok',
        'service': 'chuandou-api',
        'database': 'ok',
    }


@app.shell_context_processor
def make_shell_context():
    """Flask Shell 上下文"""
    return {
        'db': db,
        'User': User,
        'Post': Post,
        'Comment': Comment,
        'Like': Like,
        'GameRecord': GameRecord,
        'Component': Component
    }


@app.route('/')
def index():
    """全新单页全屏滚动入口"""
    return render_template('fullpage.html')

@app.route('/firstpage')
def firstpage():
    return render_template('firstpage.html')

@app.route('/old_home')
def old_home():
    """原首页备份（供全屏容器加载）"""
    return render_template('ancient-town-website.html')

@app.route('/build3d')
def build3d():
    """第二页：建筑生长动画"""
    return render_template('index.html')

@app.route('/square')
def square():
    """第三页：互动广场"""
    return render_template('square.html')

@app.route('/seismic')
def seismic():
    """第四页：抗震原理"""
    return render_template('seismic-principle-new.html')

@app.route('/timeline')
def timeline():
    """第五页：时空演变时间轴"""
    return render_template('chuan.html')

@app.route('/game')
def game():
    """游戏搭建模块"""
    return render_template('chuandou-building-game.html')

@app.route('/api/health')
def health_check():
    """健康检查（兼容旧调用）"""
    return {'status': 'ok', 'service': 'chuandou-api'}


if __name__ == '__main__':
    # 本地开发服务器；云端请使用 gunicorn
    port = int(os.environ.get('PORT', 5000))
    debug = bool(app.config.get('DEBUG'))
    app.run(host='0.0.0.0', port=port, debug=debug)
