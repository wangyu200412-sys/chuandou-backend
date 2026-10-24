"""
登录问题诊断与修复脚本
用于排查前端、后端、数据库各层问题
"""
import os
import sys
import json
import requests
import traceback

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_BASE_URL = 'http://localhost:5000/api'


def print_header(title):
    """打印分隔标题"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_result(label, value, is_error=False):
    """打印诊断结果"""
    prefix = "❌" if is_error else "✓"
    print(f"{prefix} {label}: {value}")


def check_server_status():
    """检查服务器状态"""
    print_header("1. 检查服务器状态")
    
    try:
        response = requests.get(f"{API_BASE_URL.replace('/api', '')}/api/health", timeout=5)
        if response.status_code == 200:
            print_result("服务器连接", "正常")
            return True
        else:
            print_result("服务器连接", f"异常 (HTTP {response.status_code})", True)
            return False
    except requests.exceptions.ConnectionError:
        print_result("服务器连接", "无法连接 - 服务器可能未启动", True)
        print("\n请先启动服务器:")
        print("  cd backend")
        print("  python run.py")
        return False
    except Exception as e:
        print_result("服务器连接", f"错误: {e}", True)
        return False


def check_database():
    """检查数据库状态"""
    print_header("2. 检查数据库")
    
    db_path = os.path.join(os.path.dirname(__file__), 'chuandou.db')
    
    if os.path.exists(db_path):
        print_result("数据库文件", f"存在 ({db_path})")
        
        # 检查文件大小
        size = os.path.getsize(db_path)
        if size > 0:
            print_result("数据库大小", f"{size} bytes - 正常")
            
            # 尝试连接并查询
            try:
                from app import create_app, db
                from app.models import User
                
                app = create_app()
                with app.app_context():
                    user_count = User.query.count()
                    print_result("用户表", f"存在 ({user_count} 个用户)")
                    
                    if user_count > 0:
                        users = User.query.limit(5).all()
                        print("\n  用户列表:")
                        for user in users:
                            is_admin = "👑" if user.is_admin else "👤"
                            print(f"    {is_admin} {user.username} (ID: {user.id}, is_admin: {user.is_admin})")
                    else:
                        print_result("用户数据", "为空 - 需要注册", True)
                        print("\n  运行以下命令创建用户:")
                        print("    python init_db.py --create-admin")
                        print("  或注册新用户")
                return True
            except Exception as e:
                print_result("数据库查询", f"失败: {e}", True)
                traceback.print_exc()
                return False
        else:
            print_result("数据库大小", "0 bytes - 数据库损坏或为空", True)
            return False
    else:
        print_result("数据库文件", f"不存在 ({db_path})", True)
        print("\n正在尝试创建数据库...")
        
        try:
            from app import create_app, db
            
            app = create_app()
            with app.app_context():
                db.create_all()
                print_result("数据库创建", "成功")
                
                # 创建管理员账号
                from init_db import create_admin_user
                create_admin_user()
            return True
        except Exception as e:
            print_result("数据库创建", f"失败: {e}", True)
            traceback.print_exc()
            return False


def check_registration():
    """测试用户注册"""
    print_header("3. 测试用户注册")
    
    test_user = {
        'username': f'test_user_{int(os.times().elapsed * 1000) % 10000}',
        'password': 'test123456',
        'email': '',
        'nickname': '测试用户'
    }
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/register",
            json=test_user,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print_result("注册请求状态", response.status_code)
        
        if response.status_code == 201:
            data = response.json()
            if data.get('success'):
                print_result("注册结果", "成功")
                print(f"\n  用户名: {test_user['username']}")
                print(f"  Token: {data['data']['token'][:50]}...")
                print(f"  is_admin: {data['data']['user'].get('is_admin', False)}")
                return data['data']
            else:
                print_result("注册结果", f"失败 - {data.get('message')}", True)
        else:
            try:
                error_data = response.json()
                print_result("错误信息", error_data.get('message', '未知错误'), True)
            except:
                print_result("响应内容", response.text[:200], True)
        
        return None
    except requests.exceptions.ConnectionError:
        print_result("连接失败", "服务器未启动", True)
        return None
    except Exception as e:
        print_result("请求失败", str(e), True)
        traceback.print_exc()
        return None


def check_login(username, password):
    """测试用户登录"""
    print_header(f"4. 测试用户登录 ({username})")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={'username': username, 'password': password},
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print_result("登录请求状态", response.status_code)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result("登录结果", "成功")
                print(f"\n  用户信息:")
                print(f"    ID: {data['data']['user'].get('id')}")
                print(f"    用户名: {data['data']['user'].get('username')}")
                print(f"    昵称: {data['data']['user'].get('nickname')}")
                print(f"    管理员: {'是' if data['data']['user'].get('is_admin') else '否'}")
                print(f"  Token: {data['data']['token'][:50]}...")
                
                # 检查 token 和 user 是否正确保存
                print("\n  验证数据完整性:")
                if 'token' in data['data']:
                    print_result("token", "存在 ✓")
                else:
                    print_result("token", "缺失 ✗", True)
                    
                if 'user' in data['data']:
                    print_result("user", "存在 ✓")
                    if 'is_admin' in data['data']['user']:
                        print_result("is_admin", f"{data['data']['user']['is_admin']} ✓")
                    else:
                        print_result("is_admin", "缺失 ✗", True)
                else:
                    print_result("user", "缺失 ✗", True)
                
                return data['data']
            else:
                print_result("登录结果", f"失败 - {data.get('message')}", True)
        else:
            try:
                error_data = response.json()
                print_result("错误信息", error_data.get('message', '未知错误'), True)
            except:
                print_result("响应内容", response.text[:200], True)
        
        return None
    except requests.exceptions.ConnectionError:
        print_result("连接失败", "服务器未启动", True)
        return None
    except Exception as e:
        print_result("请求失败", str(e), True)
        traceback.print_exc()
        return None


def check_profile(token):
    """测试获取用户资料"""
    print_header("5. 测试获取用户资料")
    
    if not token:
        print_result("Token", "未提供，跳过", True)
        return None
    
    try:
        response = requests.get(
            f"{API_BASE_URL}/auth/profile",
            headers={'Authorization': f'Bearer {token}'},
            timeout=10
        )
        
        print_result("请求状态", response.status_code)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_result("获取资料", "成功")
                user = data['data']['user']
                print(f"\n  用户详情:")
                print(f"    ID: {user.get('id')}")
                print(f"    用户名: {user.get('username')}")
                print(f"    管理员: {'是' if user.get('is_admin') else '否'}")
                return user
            else:
                print_result("获取资料", f"失败 - {data.get('message')}", True)
        else:
            try:
                error_data = response.json()
                print_result("错误信息", error_data.get('message', '未知错误'), True)
            except:
                print_result("响应内容", response.text[:200], True)
        
        return None
    except Exception as e:
        print_result("请求失败", str(e), True)
        return None


def check_admin_creation():
    """创建管理员账号"""
    print_header("6. 创建管理员账号")
    
    try:
        from app import create_app, db
        from app.models import User
        from werkzeug.security import generate_password_hash
        
        app = create_app()
        with app.app_context():
            # 检查是否已有管理员
            admin = User.query.filter_by(username='admin').first()
            if admin:
                print_result("管理员账号", "已存在")
                print(f"  用户名: admin")
                print(f"  ID: {admin.id}")
                print(f"  is_admin: {admin.is_admin}")
                
                if not admin.is_admin:
                    admin.is_admin = True
                    admin.avatar = '👑'
                    admin.nickname = '管理员'
                    db.session.commit()
                    print_result("权限更新", "已设置为管理员 ✓")
                return admin
            else:
                # 创建新管理员
                admin = User(
                    username='admin',
                    email='admin@chuandou.com',
                    nickname='管理员',
                    avatar='👑',
                    is_admin=True
                )
                admin.set_password('admin123')
                db.session.add(admin)
                db.session.commit()
                
                print_result("管理员创建", "成功 ✓")
                print(f"\n  用户名: admin")
                print(f"  密码: admin123")
                print(f"  ID: {admin.id}")
                return admin
    except Exception as e:
        print_result("创建失败", str(e), True)
        traceback.print_exc()
        return None


def print_summary():
    """打印诊断总结"""
    print_header("诊断总结")
    
    print("""
请按以下步骤操作:

1. 启动服务器:
   cd backend
   python run.py

2. 等待服务器启动后，在浏览器控制台测试:
   
   // 测试登录
   fetch('http://localhost:5000/api/auth/login', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({username: 'admin', password: 'admin123'})
   }).then(r => r.json()).then(console.log)

3. 常见问题排查:
   - 确保后端服务器运行在 http://localhost:5000
   - 确保前端页面从 http://localhost:5500 或通过 Live Server 访问
   - 检查浏览器控制台 Network 标签页的请求/响应
   - 检查 localStorage 中是否正确保存了 token 和 user
   - 清除浏览器缓存: localStorage.clear()
""")


def main():
    """主函数"""
    print("\n" + "=" * 60)
    print("    穿斗式建筑 - 登录问题诊断工具")
    print("=" * 60)
    
    # 1. 检查服务器
    server_ok = check_server_status()
    if not server_ok:
        print_summary()
        return
    
    # 2. 检查数据库
    db_ok = check_database()
    
    # 3. 如果没有用户，测试注册
    if db_ok:
        print_header("3b. 测试注册功能")
        register_data = check_registration()
    
    # 4. 创建/检查管理员
    admin = check_admin_creation()
    
    # 5. 测试管理员登录
    if admin:
        login_data = check_login('admin', 'admin123')
        
        # 6. 测试获取资料
        if login_data and login_data.get('token'):
            check_profile(login_data['token'])
    
    # 打印总结
    print_summary()


if __name__ == '__main__':
    main()
