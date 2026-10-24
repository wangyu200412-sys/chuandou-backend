"""
本地开发时加载 .env；云端由平台注入环境变量，未安装 python-dotenv 时静默跳过。
"""
import os


def load_local_env():
    """加载项目根目录 .env（仅用于本地开发）"""
    try:
        from dotenv import load_dotenv

        root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        load_dotenv(os.path.join(root_dir, '.env'))
    except Exception:
        pass
