"""
应用启动入口

部署说明：
- 生产启动：gunicorn --bind 0.0.0.0:$PORT run:app
- 本地启动：python run.py

注意：页面路由与健康检查已移入 app/routes/pages.py 蓝图，
由 create_app() 统一注册，这里不再重复定义，避免端点冲突。
"""
import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Post, Comment, Like, GameRecord, Component
from app.utils.env import load_local_env

# 本地开发可选加载 .env；云端由平台注入环境变量
load_local_env()

# 创建应用实例（页面与接口路由都在 create_app 内注册）
app = create_app(os.getenv('FLASK_ENV', 'development'))


# 可选：启动前建表（由 INIT_DB_ON_START=true 开启，供免费用法使用）
if os.getenv('INIT_DB_ON_START', '').strip().lower() in ('1', 'true', 'yes', 'on'):
    with app.app_context():
        db.create_all()


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


if __name__ == '__main__':
    # 本地开发服务器；云端请使用 gunicorn
    port = int(os.environ.get('PORT', 5000))
    debug = bool(app.config.get('DEBUG'))
    app.run(host='0.0.0.0', port=port, debug=debug)
