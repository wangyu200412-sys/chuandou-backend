#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
管理员登录问题诊断和修复脚本
使用方法: python debug_login.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User
from werkzeug.security import generate_password_hash, check_password_hash


def diagnose():
    """诊断登录问题"""
    print("=" * 60)
    print("管理员登录问题诊断")
    print("=" * 60)
    
    app = create_app()
    
    with app.app_context():
        # 1. 检查数据库连接
        print("\n[1] 检查数据库连接")
        try:
            users = User.query.all()
            print(f"    ✅ 数据库连接成功")
            print(f"    当前用户数: {len(users)}")
        except Exception as e:
            print(f"    ❌ 数据库连接失败: {e}")
            return
        
        # 2. 列出所有用户
        print("\n[2] 数据库中的用户")
        if not users:
            print("    ⚠️  数据库中没有用户，需要先注册")
        else:
            for u in users:
                admin_status = "👑 管理员" if u.is_admin else "👤 普通用户"
                active_status = "✅ 正常" if u.is_active else "❌ 已禁用"
                print(f"    - 用户名: {u.username}")
                print(f"      ID: {u.id}")
                print(f"      邮箱: {u.email}")
                print(f"      状态: {admin_status}, {active_status}")
                print(f"      密码哈希: {u.password_hash[:30]}...")
                print()
        
        # 3. 检查 JWT 配置
        print("\n[3] JWT 配置检查")
        jwt_key = app.config.get('JWT_SECRET_KEY')
        print(f"    JWT_SECRET_KEY: {jwt_key}")
        print(f"    密钥长度: {len(jwt_key) if jwt_key else 0}")
        print(f"    Token 过期时间: {app.config.get('JWT_ACCESS_TOKEN_EXPIRES')}")
        
        # 4. 测试密码加密
        print("\n[4] 密码加密测试")
        test_password = "admin123"
        hashed = generate_password_hash(test_password)
        print(f"    原始密码: {test_password}")
        print(f"    加密后: {hashed}")
        print(f"    验证结果: {check_password_hash(hashed, test_password)}")
        
        # 5. 测试管理员登录
        print("\n[5] 模拟管理员登录测试")
        test_username = "admin"
        test_password = "admin123"
        
        user = User.query.filter_by(username=test_username).first()
        if user:
            print(f"    找到用户: {test_username}")
            print(f"    is_admin: {user.is_admin}")
            print(f"    is_active: {user.is_active}")
            
            password_ok = user.check_password(test_password)
            print(f"    密码验证: {'✅ 通过' if password_ok else '❌ 失败'}")
            
            if password_ok and user.is_active:
                from flask_jwt_extended import create_access_token
                token = create_access_token(identity=str(user.id))
                print(f"    ✅ 可以生成 Token: {token[:50]}...")
            else:
                print(f"    ❌ 无法登录")
        else:
            print(f"    ⚠️  用户 '{test_username}' 不存在")


def create_admin_user(username="admin", password="admin123"):
    """创建或重置管理员账号"""
    print("\n" + "=" * 60)
    print(f"创建/重置管理员账号: {username}")
    print("=" * 60)
    
    app = create_app()
    
    with app.app_context():
        # 检查是否已存在
        existing = User.query.filter_by(username=username).first()
        
        if existing:
            print(f"\n用户 '{username}' 已存在")
            print(f"  当前 is_admin: {existing.is_admin}")
            print(f"  当前 is_active: {existing.is_active}")
            
            # 更新为管理员
            existing.is_admin = True
            existing.is_active = True
            existing.set_password(password)
            db.session.commit()
            print(f"\n✅ 已更新为管理员，密码已重置")
        else:
            # 创建新用户
            new_user = User(
                username=username,
                email=f"{username}@admin.com",
                nickname="系统管理员",
                avatar="👑",
                is_admin=True,
                is_active=True
            )
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            print(f"\n✅ 管理员账号创建成功")
        
        print(f"\n  用户名: {username}")
        print(f"  密码: {password}")
        print(f"  权限: 管理员")


def test_login_api(username, password):
    """通过 API 测试登录"""
    print("\n" + "=" * 60)
    print(f"API 测试登录")
    print("=" * 60)
    
    import requests
    import json
    
    # 启动后端服务后执行此测试
    url = "http://localhost:5000/api/auth/login"
    data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(url, json=data)
        result = response.json()
        
        print(f"\n请求 URL: {url}")
        print(f"请求数据: {json.dumps(data)}")
        print(f"响应状态: {response.status_code}")
        print(f"响应内容: {json.dumps(result, ensure_ascii=False, indent=2)}")
        
        if result.get('success'):
            print(f"\n✅ 登录成功!")
            print(f"Token: {result['data']['token'][:50]}...")
            print(f"用户信息:")
            print(f"  - 用户名: {result['data']['user']['username']}")
            print(f"  - 昵称: {result['data']['user']['nickname']}")
            print(f"  - 管理员: {result['data']['user']['is_admin']}")
        else:
            print(f"\n❌ 登录失败: {result.get('message')}")
            
    except requests.exceptions.ConnectionError:
        print(f"\n⚠️  无法连接到后端服务")
        print(f"请确保后端服务正在运行: python run.py")
    except Exception as e:
        print(f"\n❌ 发生错误: {e}")


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("穿斗式建筑 - 管理员登录诊断工具")
    print("=" * 60)
    
    # 首先运行诊断
    diagnose()
    
    # 提供创建管理员的选项
    print("\n" + "-" * 60)
    print("是否创建/重置管理员账号?")
    print("  python debug_login.py create          - 创建默认管理员 (admin/admin123)")
    print("  python debug_login.py create 用户名 密码 - 创建自定义管理员")
    print("  python debug_login.py test            - 测试 API 登录")
    print("-" * 60)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == 'create':
            if len(sys.argv) > 3:
                create_admin_user(sys.argv[2], sys.argv[3])
            elif len(sys.argv) > 2:
                create_admin_user(sys.argv[2])
            else:
                create_admin_user()
        elif command == 'test':
            test_login_api('admin', 'admin123')
