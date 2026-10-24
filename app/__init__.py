"""
Flask应用初始化
"""
import os

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from config import config

# 初始化扩展
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name='default'):
    """创建Flask应用实例"""
    app = Flask(__name__, instance_relative_config=True)

    # 先校验环境变量：生产环境缺少密钥时直接失败，避免回退到公开默认值
    config[config_name].validate(app)

    app.config.from_object(config[config_name])

    # 再以运行时环境变量覆盖一次，确保平台注入的值优先于类属性默认值
    config[config_name].apply_runtime_env(app)

    # 初始化扩展
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # CORS：前后端同源时不启用；设置了 CORS_ORIGINS 才按白名单开启
    cors_origins = app.config.get('CORS_ORIGINS') or []
    if cors_origins:
        CORS(
            app,
            resources={r"/api/*": {"origins": cors_origins}},
            supports_credentials=app.config.get('CORS_SUPPORTS_CREDENTIALS', False),
            allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
            expose_headers=["Content-Length", "X-Total-Count"],
            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        )

    # 确保上传目录存在
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # 注册蓝图
    from app.routes.auth import auth_bp
    from app.routes.posts import posts_bp
    from app.routes.game import game_bp
    from app.routes.components import components_bp
    from app.routes.admin import admin_bp
    from app.routes.uploads import uploads_bp
    # 页面路由与健康检查：保持历史端点名，保证模板中 url_for('xxx') 仍然可用
    from app.routes.pages import register_pages

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(posts_bp, url_prefix='/api/posts')
    app.register_blueprint(game_bp, url_prefix='/api/game')
    app.register_blueprint(components_bp, url_prefix='/api/components')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(uploads_bp)
    register_pages(app)

    # 注册错误处理
    register_error_handlers(app)

    # JWT错误处理
    @jwt.invalid_token_loader
    def invalid_token_callback(error_string):
        return jsonify({'success': False, 'message': '无效的登录凭证，请重新登录'}), 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'success': False, 'message': '登录已过期，请重新登录'}), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error_string):
        return jsonify({'success': False, 'message': '请先登录'}), 401

    # 建表统一交给 init_db.py，避免 Gunicorn 多 worker 在启动时并发建表
    return app


def register_error_handlers(app):
    """注册错误处理器"""

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'success': False, 'message': '请求参数错误'}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'success': False, 'message': '未授权访问'}), 401

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'success': False, 'message': '资源不存在'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'success': False, 'message': '服务器内部错误'}), 500
