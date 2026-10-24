"""
文件共享 API 服务器
允许网络中的其他设备通过 HTTP 请求访问共享的文件和数据
"""

import os
import json
import secrets
import mimetypes
from datetime import datetime, timedelta
from pathlib import Path
from flask import Flask, request, jsonify, send_file, abort
from flask_cors import CORS
from werkzeug.utils import secure_filename
import hashlib

# ==================== 配置 ====================
DEFAULT_CONFIG = {
    "server": {
        "host": "0.0.0.0",
        "port": 8000,
        "debug": False
    },
    "auth": {
        "enabled": True,
        "users": [
            {
                "username": "admin",
                "password_hash": hashlib.sha256("admin123".encode()).hexdigest(),
                "role": "admin"
            }
        ]
    },
    "storage": {
        "shared_dir": "./shared_files",
        "max_file_size_mb": 100,
        "allowed_extensions": ["*"],
        "allow_overwrite": True
    },
    "security": {
        "api_keys": [],
        "rate_limit_per_minute": 60
    }
}

CONFIG_FILE = "file_share_config.json"
TOKENS = {}  # 存储有效的 token: {token: {username, expires_at}}


# ==================== 初始化 ====================
def load_config():
    """加载配置文件，如果不存在则创建默认配置"""
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_CONFIG, f, indent=2, ensure_ascii=False)
        return DEFAULT_CONFIG


def create_app():
    app = Flask(__name__)
    config = load_config()

    # CORS 配置 - 允许所有来源访问
    CORS(app, origins="*")

    # 确保共享目录存在
    shared_dir = config["storage"]["shared_dir"]
    os.makedirs(shared_dir, exist_ok=True)

    # ==================== 认证相关函数 ====================
    def verify_user(username, password):
        """验证用户凭据"""
        if not config["auth"]["enabled"]:
            return True, {"username": "guest", "role": "guest"}

        password_hash = hashlib.sha256(password.encode()).hexdigest()
        for user in config["auth"]["users"]:
            if user["username"] == username and user["password_hash"] == password_hash:
                return True, user
        return False, None

    def verify_token(token):
        """验证 API token"""
        if token in TOKENS:
            if datetime.fromisoformat(TOKENS[token]["expires_at"]) > datetime.now():
                return True, TOKENS[token]
            else:
                del TOKENS[token]  # 过期则删除
        return False, None

    def verify_api_key(api_key):
        """验证 API Key"""
        return api_key in config["security"]["api_keys"]

    def require_auth(f):
        """认证装饰器"""
        from functools import wraps

        @wraps(f)
        def decorated(*args, **kwargs):
            if not config["auth"]["enabled"]:
                return f(*args, **kwargs)

            # 检查 token
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
                valid, _ = verify_token(token)
                if valid:
                    return f(*args, **kwargs)

            # 检查 API Key
            api_key = request.headers.get('X-API-Key', '')
            if verify_api_key(api_key):
                return f(*args, **kwargs)

            return jsonify({
                "success": False,
                "message": "需要认证。请提供 Bearer Token 或 API Key"
            }), 401

        return decorated

    # ==================== API 路由 ====================

    @app.route('/api/auth/login', methods=['POST'])
    def login():
        """用户登录，获取访问令牌"""
        if not config["auth"]["enabled"]:
            return jsonify({
                "success": True,
                "message": "认证已禁用",
                "token": "no-auth"
            })

        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "请提供用户名和密码"}), 400

        username = data.get('username', '')
        password = data.get('password', '')

        valid, user = verify_user(username, password)
        if not valid:
            return jsonify({"success": False, "message": "用户名或密码错误"}), 401

        # 生成 token (24小时有效)
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now() + timedelta(hours=24)).isoformat()
        TOKENS[token] = {
            "username": user["username"],
            "role": user["role"],
            "expires_at": expires_at
        }

        return jsonify({
            "success": True,
            "message": "登录成功",
            "token": token,
            "expires_at": expires_at,
            "user": {
                "username": user["username"],
                "role": user["role"]
            }
        })

    @app.route('/api/auth/verify', methods=['GET'])
    @require_auth
    def verify():
        """验证当前 token 是否有效"""
        auth_header = request.headers.get('Authorization', '')
        token = auth_header[7:]
        token_data = TOKENS.get(token, {})

        return jsonify({
            "success": True,
            "valid": True,
            "user": {
                "username": token_data.get("username"),
                "role": token_data.get("role")
            },
            "expires_at": token_data.get("expires_at")
        })

    @app.route('/api/files', methods=['GET'])
    @require_auth
    def list_files():
        """列出共享目录中的所有文件"""
        shared_dir = config["storage"]["shared_dir"]
        files = []

        for item in os.listdir(shared_dir):
            item_path = os.path.join(shared_dir, item)
            if os.path.isfile(item_path):
                stat = os.stat(item_path)
                files.append({
                    "name": item,
                    "size": stat.st_size,
                    "size_human": _human_readable_size(stat.st_size),
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "url": f"{request.host_url.rstrip('/')}/api/files/{item}"
                })

        return jsonify({
            "success": True,
            "count": len(files),
            "files": files
        })

    @app.route('/api/files/<filename>', methods=['GET'])
    @require_auth
    def download_file(filename):
        """下载指定文件"""
        shared_dir = config["storage"]["shared_dir"]
        file_path = os.path.join(shared_dir, secure_filename(filename))

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            return jsonify({"success": False, "message": "文件不存在"}), 404

        # 获取 MIME 类型
        mime_type, _ = mimetypes.guess_type(file_path)
        if not mime_type:
            mime_type = 'application/octet-stream'

        return send_file(
            file_path,
            mimetype=mime_type,
            as_attachment=True,
            download_name=filename
        )

    @app.route('/api/files/<filename>', methods=['DELETE'])
    @require_auth
    def delete_file(filename):
        """删除指定文件"""
        shared_dir = config["storage"]["shared_dir"]
        file_path = os.path.join(shared_dir, secure_filename(filename))

        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            return jsonify({"success": False, "message": "文件不存在"}), 404

        try:
            os.remove(file_path)
            return jsonify({
                "success": True,
                "message": f"文件 {filename} 已删除"
            })
        except Exception as e:
            return jsonify({"success": False, "message": f"删除失败: {str(e)}"}), 500

    @app.route('/api/files/upload', methods=['POST'])
    @require_auth
    def upload_file():
        """上传文件到共享目录"""
        shared_dir = config["storage"]["shared_dir"]

        if 'file' not in request.files:
            return jsonify({"success": False, "message": "没有文件部分"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "message": "未选择文件"}), 400

        # 检查文件大小
        max_size = config["storage"]["max_file_size_mb"] * 1024 * 1024
        file.seek(0, 2)  # 移动到文件末尾
        file_size = file.tell()
        file.seek(0)  # 重置文件指针

        if file_size > max_size:
            return jsonify({
                "success": False,
                "message": f"文件大小超过限制 ({config['storage']['max_file_size_mb']}MB)"
            }), 413

        # 保存文件
        filename = secure_filename(file.filename)
        if not config["storage"]["allow_overwrite"]:
            base, ext = os.path.splitext(filename)
            counter = 1
            while os.path.exists(os.path.join(shared_dir, filename)):
                filename = f"{base}_{counter}{ext}"
                counter += 1

        file_path = os.path.join(shared_dir, filename)
        file.save(file_path)

        return jsonify({
            "success": True,
            "message": "文件上传成功",
            "file": {
                "name": filename,
                "size": os.path.getsize(file_path),
                "url": f"{request.host_url.rstrip('/')}/api/files/{filename}"
            }
        })

    @app.route('/api/info', methods=['GET'])
    def server_info():
        """获取服务器信息（无需认证）"""
        shared_dir = config["storage"]["shared_dir"]
        file_count = len([f for f in os.listdir(shared_dir) if os.path.isfile(os.path.join(shared_dir, f))])

        return jsonify({
            "server_name": "穿斗式建筑 - 文件共享服务",
            "version": "1.0.0",
            "auth_required": config["auth"]["enabled"],
            "shared_dir": os.path.abspath(shared_dir),
            "file_count": file_count,
            "max_file_size_mb": config["storage"]["max_file_size_mb"],
            "endpoints": {
                "login": "POST /api/auth/login",
                "verify": "GET /api/auth/verify",
                "list": "GET /api/files",
                "download": "GET /api/files/<filename>",
                "upload": "POST /api/files/upload",
                "delete": "DELETE /api/files/<filename>",
                "docs": "GET /api/docs"
            }
        })

    @app.route('/api/docs', methods=['GET'])
    def docs():
        """返回 API 文档"""
        return jsonify({
            "name": "文件共享 API 文档",
            "version": "1.0.0",
            "base_url": request.host_url.rstrip('/'),

            "authentication": {
                "type": "Bearer Token 或 API Key",
                "login_endpoint": "POST /api/auth/login",
                "login_body": {
                    "username": "用户名",
                    "password": "密码"
                },
                "example": {
                    "username": "admin",
                    "password": "admin123"
                },
                "usage": "在请求头中添加: Authorization: Bearer <your_token>"
            },

            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/info",
                    "description": "获取服务器信息（无需认证）",
                    "auth_required": False
                },
                {
                    "method": "POST",
                    "path": "/api/auth/login",
                    "description": "用户登录，获取访问令牌",
                    "auth_required": False,
                    "body": {"username": "string", "password": "string"}
                },
                {
                    "method": "GET",
                    "path": "/api/auth/verify",
                    "description": "验证 token 是否有效",
                    "auth_required": True
                },
                {
                    "method": "GET",
                    "path": "/api/files",
                    "description": "列出所有共享文件",
                    "auth_required": True
                },
                {
                    "method": "GET",
                    "path": "/api/files/<filename>",
                    "description": "下载指定文件",
                    "auth_required": True
                },
                {
                    "method": "POST",
                    "path": "/api/files/upload",
                    "description": "上传文件",
                    "auth_required": True,
                    "body": "multipart/form-data with 'file' field"
                },
                {
                    "method": "DELETE",
                    "path": "/api/files/<filename>",
                    "description": "删除指定文件",
                    "auth_required": True
                }
            ],

            "examples": {
                "login": {
                    "curl": 'curl -X POST {base_url}/api/auth/login -H "Content-Type: application/json" -d "{{\\"username\\": \\"admin\\", \\"password\\": \\"admin123\\"}}"'
                },
                "list_files": {
                    "curl": 'curl -X GET {base_url}/api/files -H "Authorization: Bearer <your_token>"'
                },
                "download": {
                    "curl": 'curl -X GET {base_url}/api/files/<filename> -H "Authorization: Bearer <your_token>" -o output.file'
                },
                "upload": {
                    "curl": 'curl -X POST {base_url}/api/files/upload -H "Authorization: Bearer <your_token>" -F "file=@/path/to/file"'
                },
                "delete": {
                    "curl": 'curl -X DELETE {base_url}/api/files/<filename> -H "Authorization: Bearer <your_token>"'
                }
            }
        })

    # ==================== 辅助函数 ====================
    def _human_readable_size(size_bytes):
        """将字节大小转换为人类可读格式"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if size_bytes < 1024.0:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.2f} PB"

    # ==================== 启动信息 ====================
    @app.route('/')
    def index():
        """主页 - 显示简单的 HTML 界面"""
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>文件共享服务</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                h1 { color: #333; }
                .endpoint { background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 5px; }
                .method { display: inline-block; padding: 2px 8px; border-radius: 3px; color: white; font-weight: bold; }
                .GET { background: #61affe; }
                .POST { background: #49cc90; }
                .DELETE { background: #f93e3e; }
                code { background: #eee; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <h1>📁 文件共享 API 服务</h1>
            <p>服务正在运行！访问 <code>/api/docs</code> 查看完整 API 文档。</p>
            
            <h2>可用端点：</h2>
            <div class="endpoint"><span class="method GET">GET</span> <code>/api/info</code> - 服务器信息</div>
            <div class="endpoint"><span class="method POST">POST</span> <code>/api/auth/login</code> - 登录</div>
            <div class="endpoint"><span class="method GET">GET</span> <code>/api/files</code> - 列出文件</div>
            <div class="endpoint"><span class="method GET">GET</span> <code>/api/files/&lt;filename&gt;</code> - 下载文件</div>
            <div class="endpoint"><span class="method POST">POST</span> <code>/api/files/upload</code> - 上传文件</div>
            <div class="endpoint"><span class="method DELETE">DELETE</span> <code>/api/files/&lt;filename&gt;</code> - 删除文件</div>
            <div class="endpoint"><span class="method GET">GET</span> <code>/api/docs</code> - API 文档</div>
            
            <h2>快速测试：</h2>
            <p>1. 登录获取 token：</p>
            <code>curl -X POST http://localhost:8000/api/auth/login -H "Content-Type: application/json" -d "{\\"username\\": \\"admin\\", \\"password\\": \\"admin123\\"}"</code>
            
            <p style="margin-top: 20px;">2. 使用 token 列出文件：</p>
            <code>curl -X GET http://localhost:8000/api/files -H "Authorization: Bearer &lt;your_token&gt;"</code>
        </body>
        </html>
        """
        return html

    return app, config


# ==================== 主程序 ====================
if __name__ == '__main__':
    app, config = create_app()

    print("=" * 60)
    print("📁 文件共享 API 服务器")
    print("=" * 60)
    print(f"🌐 服务地址: http://{config['server']['host']}:{config['server']['port']}")
    print(f"📂 共享目录: {os.path.abspath(config['storage']['shared_dir'])}")
    print(f"🔐 认证状态: {'已启用' if config['auth']['enabled'] else '已禁用'}")
    print(f"📖 API文档: http://localhost:{config['server']['port']}/api/docs")
    print("=" * 60)
    print("⚠️  默认管理员账号: admin / admin123")
    print("⚠️  请及时修改默认密码！")
    print("=" * 60)

    app.run(
        host=config['server']['host'],
        port=config['server']['port'],
        debug=config['server']['debug']
    )
