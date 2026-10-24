"""
检查admin用户状态
"""
import os
import sys

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    admin = User.query.filter_by(username='admin').first()
    
    if admin:
        print(f"=== Admin 用户信息 ===")
        print(f"ID: {admin.id}")
        print(f"用户名: {admin.username}")
        print(f"邮箱: {admin.email}")
        print(f"昵称: {admin.nickname}")
        print(f"is_admin: {admin.is_admin}")
        print(f"is_active: {admin.is_active}")
        print(f"密码哈希: {admin.password_hash[:50]}...")
        
        # 测试密码验证
        if admin.check_password('admin123'):
            print("[PASS] Password admin123 is correct")
        else:
            print("[FAIL] Password admin123 is incorrect")
            
        if admin.is_admin:
            print("[INFO] User is already admin")
        else:
            print("[UPDATE] Setting user as admin...")
            admin.is_admin = True
            db.session.commit()
            print("[DONE] admin user is now admin!")
    else:
        print("❌ admin 用户不存在，需要创建")
        
    # 列出所有用户
    print("\n=== 所有用户 ===")
    users = User.query.all()
    for u in users:
        print(f"ID:{u.id} | {u.username} | is_admin:{u.is_admin} | is_active:{u.is_active}")
