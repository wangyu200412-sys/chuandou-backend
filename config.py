"""
配置文件

所有敏感信息与环境相关配置统一从环境变量读取。
生产环境（FLASK_ENV=production）缺少必要密钥时直接报错，避免悄悄使用默认值。
"""
import os
from datetime import timedelta
from urllib.parse import urlparse, urlunparse

basedir = os.path.abspath(os.path.dirname(__file__))


def _env_flag(name, default=False):
    """读取布尔型环境变量"""
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def _normalize_database_url(url):
    """
    兼容各平台提供的数据库地址：
    - Render / Supabase 常见的 postgres:// 前缀改为 SQLAlchemy 可用的 postgresql+psycopg2://
    - Postgres 连接默认补充 sslmode=require
    """
    if not url:
        return None

    url = url.strip()
    if url.startswith('postgres://'):
        url = 'postgresql+psycopg2://' + url[len('postgres://'):]
    elif url.startswith('postgresql://'):
        url = 'postgresql+psycopg2://' + url[len('postgresql://'):]

    if not url.startswith('postgresql'):
        return url

    parsed = urlparse(url)
    query = parsed.query
    if 'sslmode' not in query:
        query = 'sslmode=require' if not query else query + '&sslmode=require'
    return urlunparse(parsed._replace(query=query))


def _build_database_uri(default_path=None):
    """实时读取 DATABASE_URL，未设置时回退到 SQLite"""
    db_url = _normalize_database_url(os.environ.get('DATABASE_URL'))
    if db_url:
        return db_url
    path = default_path or os.path.join(basedir, 'chuandou.db')
    return 'sqlite:///' + str(path).replace('\\', '/')


def _default_upload_folder():
    """
    上传目录默认值：
    - 本地开发：项目内 uploads
    - 云端部署：容器内 /tmp/uploads（免费实例文件系统为临时存储，重启后不保留）
    """
    if os.environ.get('UPLOAD_FOLDER'):
        return os.environ['UPLOAD_FOLDER']
    if os.environ.get('RENDER'):
        return '/tmp/uploads'
    return os.path.join(basedir, 'uploads')


class Config:
    """基础配置"""

    # 运行环境
    ENV = os.environ.get('FLASK_ENV', 'production').lower()
    DEBUG = _env_flag('FLASK_DEBUG', False)

    # 密钥：生产环境必须显式提供（validate() 会拦截空值）
    SECRET_KEY = os.environ.get('SECRET_KEY') or ''
    JWT_SECRET_KEY = (os.environ.get('JWT_SECRET_KEY') or os.environ.get('SECRET_KEY') or '')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_ALGORITHM = 'HS256'

    # 数据库配置（运行时会以环境变量为准）
    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }

    # 文件上传配置
    UPLOAD_FOLDER = _default_upload_folder()
    MAX_CONTENT_LENGTH = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    # local: 保存到容器本地（云端为临时存储）；disabled: 关闭上传
    UPLOAD_STORAGE = os.environ.get('UPLOAD_STORAGE', 'local')

    # 分页配置
    POSTS_PER_PAGE = 10
    COMMENTS_PER_PAGE = 20

    # CORS 配置：留空表示前后端同源，不开启跨域
    CORS_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', '').split(',') if origin.strip()]
    CORS_SUPPORTS_CREDENTIALS = _env_flag('CORS_SUPPORTS_CREDENTIALS', False)

    # 静态资源强缓存（避免每次刷新都重新下载 3D 模型）
    SEND_FILE_MAX_AGE_DEFAULT = timedelta(days=7)

    # 百度内容审核（可选）
    AI_API_KEY = os.environ.get('AI_API_KEY')
    AI_SECRET_KEY = os.environ.get('AI_SECRET_KEY')
    AI_CONTENT_CHECK = _env_flag('AI_CONTENT_CHECK', False)

    @classmethod
    def apply_runtime_env(cls, app):
        """把当前环境变量写入 app.config，确保以平台注入的值为准"""
        secret_key = os.environ.get('SECRET_KEY')
        jwt_secret_key = os.environ.get('JWT_SECRET_KEY') or secret_key

        if secret_key:
            app.config['SECRET_KEY'] = secret_key
        if jwt_secret_key:
            app.config['JWT_SECRET_KEY'] = jwt_secret_key

        app.config['SQLALCHEMY_DATABASE_URI'] = _build_database_uri()
        app.config['UPLOAD_FOLDER'] = _default_upload_folder()
        app.config['MAX_CONTENT_LENGTH'] = int(os.environ.get('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))
        app.config['UPLOAD_STORAGE'] = os.environ.get('UPLOAD_STORAGE', 'local')
        app.config['AI_API_KEY'] = os.environ.get('AI_API_KEY')
        app.config['AI_SECRET_KEY'] = os.environ.get('AI_SECRET_KEY')
        app.config['AI_CONTENT_CHECK'] = _env_flag('AI_CONTENT_CHECK', False)
        app.config['CORS_ORIGINS'] = [
            origin.strip() for origin in os.environ.get('CORS_ORIGINS', '').split(',') if origin.strip()
        ]
        app.config['CORS_SUPPORTS_CREDENTIALS'] = _env_flag('CORS_SUPPORTS_CREDENTIALS', False)
        return True

    @classmethod
    def validate(cls, app=None):
        """
        校验生产环境必要配置。
        这里实时读取环境变量，避免平台在进程启动后注入变量导致误判。
        """
        env = os.environ.get('FLASK_ENV', '').strip().lower()
        is_production = env == 'production' or cls.ENV == 'production'

        secret_key = os.environ.get('SECRET_KEY')
        jwt_secret_key = os.environ.get('JWT_SECRET_KEY') or secret_key

        if is_production:
            missing = []
            if not secret_key:
                missing.append('SECRET_KEY')
            if not jwt_secret_key:
                missing.append('JWT_SECRET_KEY')
            if missing:
                raise RuntimeError(
                    '生产环境缺少必要环境变量：' + ', '.join(missing) +
                    '。请在 Render Dashboard 的 Environment 中设置后重启服务。'
                )

        if app is not None:
            cls.apply_runtime_env(app)
            app.config['ENV'] = 'production' if is_production else cls.ENV
            app.config['DEBUG'] = (
                _env_flag('FLASK_DEBUG', False) if env in ('', 'production') else cls.DEBUG
            )

        return True


class DevelopmentConfig(Config):
    """开发环境配置：不强制要求生产密钥，方便本地启动"""
    ENV = 'development'
    DEBUG = True


class ProductionConfig(Config):
    """生产环境配置：缺少密钥直接启动失败"""
    ENV = 'production'
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
