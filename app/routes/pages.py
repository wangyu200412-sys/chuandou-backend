"""
页面路由与健康检查

历史问题：这些路由原先直接挂在 run.py 的 app 对象上，只有以 `run:app` 启动时才生效；
一旦部署命令写成别的应用工厂，整站页面都会 404。
现在由 create_app() 统一注册，任何启动方式下应用都是完整的。

注意：这里用 add_url_rule 显式指定端点名（而不是蓝图），
因为模板中存在大量 url_for('firstpage') 这类按原名调用的写法，端点名必须保持一致。
"""
from flask import current_app, render_template
from sqlalchemy import text

from app import db


def health():
    """
    Render 健康检查：只做轻量查询，需在数秒内返回。
    数据库不可用时返回 503，避免平台把流量继续打到异常实例。
    """
    try:
        db.session.execute(text('SELECT 1'))
    except Exception as exc:  # 日志中不输出完整连接串
        current_app.logger.error('健康检查数据库失败: %s', exc)
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


def health_check():
    """健康检查（兼容旧调用）"""
    return {'status': 'ok', 'service': 'chuandou-api'}


def index():
    """全新单页全屏滚动入口"""
    return render_template('fullpage.html')


def firstpage():
    return render_template('firstpage.html')


def old_home():
    """原首页备份（供全屏容器加载）"""
    return render_template('ancient-town-website.html')


def build3d():
    """第二页：建筑生长动画"""
    return render_template('index.html')


def square():
    """第三页：互动广场"""
    return render_template('square.html')


def seismic():
    """第四页：抗震原理"""
    return render_template('seismic-principle-new.html')


def timeline():
    """第五页：时空演变时间轴"""
    return render_template('chuan.html')


def game():
    """游戏搭建模块"""
    return render_template('chuandou-building-game.html')


def register_pages(app):
    """注册页面路由，端点名保持与历史一致"""
    app.add_url_rule('/health', 'health', health)
    app.add_url_rule('/api/health', 'health_check', health_check)
    app.add_url_rule('/', 'index', index)
    app.add_url_rule('/firstpage', 'firstpage', firstpage)
    app.add_url_rule('/old_home', 'old_home', old_home)
    app.add_url_rule('/build3d', 'build3d', build3d)
    app.add_url_rule('/square', 'square', square)
    app.add_url_rule('/seismic', 'seismic', seismic)
    app.add_url_rule('/timeline', 'timeline', timeline)
    app.add_url_rule('/game', 'game', game)
    return app
