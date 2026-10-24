"""
数据库初始化脚本
"""
import os
import sys
import argparse

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User, Post, Comment, Like, GameRecord, Component
from app.utils.env import load_local_env

load_local_env()

# 创建应用实例
app = create_app(os.getenv('FLASK_ENV', 'development'))

def create_admin_user(username='admin', password='admin123'):
    """创建管理员账号"""
    existing_admin = User.query.filter_by(username=username).first()
    if existing_admin:
        print(f"[INFO] User '{username}' already exists, updating to admin...")
        existing_admin.is_admin = True
        existing_admin.avatar = '👑'
        existing_admin.nickname = '管理员'
        db.session.commit()
        print(f"[INFO] User '{username}' has been granted admin privileges!")
        return existing_admin
    else:
        admin = User(
            username=username,
            email='admin@example.com',
            nickname='管理员',
            avatar='👑',
            is_admin=True
        )
        admin.set_password(password)
        db.session.add(admin)
        db.session.commit()
        print(f"[INFO] Admin user '{username}' created successfully!")
        print(f"[INFO] Username: {username}")
        print(f"[INFO] Password: {password}")
        return admin

# 在应用上下文中创建数据库表
with app.app_context():
    parser = argparse.ArgumentParser(description='Database initialization script')
    parser.add_argument('--create-admin', action='store_true', help='Create admin user')
    parser.add_argument('--admin-username', default=os.getenv('ADMIN_USERNAME', 'admin'), help='Admin username')
    parser.add_argument('--admin-password', default=os.getenv('ADMIN_PASSWORD'), help='Admin password')
    parser.add_argument('--set-admin', metavar='USERNAME', help='Set existing user as admin')
    args = parser.parse_args()

    print("[INFO] Creating database tables...")
    db.create_all()
    print("[INFO] Database tables created successfully!")

    if args.set_admin:
        user = User.query.filter_by(username=args.set_admin).first()
        if user:
            user.is_admin = True
            db.session.commit()
            print(f"[INFO] User '{args.set_admin}' has been granted admin privileges!")
        else:
            print(f"[ERROR] User '{args.set_admin}' not found!")

    if args.create_admin:
        if not args.admin_password:
            print("[ERROR] 请通过 --admin-password 或 ADMIN_PASSWORD 设置管理员密码")
        else:
            create_admin_user(args.admin_username, args.admin_password)
    
    # 检查是否需要初始化构件数据
    if Component.query.count() == 0:
        print("[INFO] Initializing component data...")
        print("[INFO] You can initialize component data via POST /api/components/init")
    
    print("[INFO] Database initialization completed!")
