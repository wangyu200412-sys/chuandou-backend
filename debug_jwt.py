"""调试 JWT Token 问题 - 完整测试"""
import sys
sys.path.insert(0, '.')

from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    # 检查数据库中的用户
    users = User.query.all()
    print(f"数据库中的用户数: {len(users)}")
    for u in users:
        print(f"  - {u.username} (id={u.id}, is_admin={u.is_admin})")
    
    # 检查 JWT 配置
    print(f"\n=== JWT 配置 ===")
    print(f"JWT_SECRET_KEY: {app.config.get('JWT_SECRET_KEY')}")
    print(f"JWT_SECRET_KEY 长度: {len(app.config.get('JWT_SECRET_KEY', ''))}")
    print(f"JWT_ACCESS_TOKEN_EXPIRES: {app.config.get('JWT_ACCESS_TOKEN_EXPIRES')}")
    
    # 测试登录并生成 token
    if users:
        from flask_jwt_extended import create_access_token, decode_token
        test_user = users[0]
        token = create_access_token(identity=str(test_user.id))
        print(f"\n=== 生成的 Token ===")
        print(f"Token: {token}")
        print(f"Token 长度: {len(token)}")
        
        # 直接解码验证
        print(f"\n=== 直接解码 Token ===")
        try:
            decoded = decode_token(token)
            print(f"解码成功: {decoded}")
        except Exception as e:
            print(f"解码失败: {e}")
        
        # 模拟请求验证
        print(f"\n=== 模拟 /api/auth/profile 请求 ===")
        with app.test_client() as client:
            # 测试有效 token
            response = client.get('/api/auth/profile', 
                headers={'Authorization': f'Bearer {token}'})
            print(f"有效 Token 请求状态: {response.status_code}")
            print(f"响应: {response.get_json()}")

            # 测试无效 token
            response = client.get('/api/auth/profile', 
                headers={'Authorization': 'Bearer invalid_token'})
            print(f"\n无效 Token 请求状态: {response.status_code}")
            print(f"响应: {response.get_json()}")
