"""检查数据库用户表"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

app = create_app()

with app.app_context():
    print("=" * 50)
    print("数据库用户检查")
    print("=" * 50)
    
    # 检查表是否存在
    try:
        user_count = User.query.count()
        print(f"用户总数: {user_count}")
    except Exception as e:
        print(f"查询失败: {e}")
        sys.exit(1)
    
    if user_count == 0:
        print("\n没有用户数据!")
        print("正在创建管理员账号...")
        
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
        print(f"管理员创建成功!")
        print(f"  用户名: admin")
        print(f"  密码: admin123")
    else:
        print("\n用户列表:")
        users = User.query.all()
        for user in users:
            admin_tag = " 👑" if user.is_admin else ""
            active_tag = "" if user.is_active else " (禁用)"
            print(f"  [{user.id}] {user.username}{admin_tag}{active_tag}")
            
            # 验证用户数据完整性
            print(f"       email: {user.email}")
            print(f"       nickname: {user.nickname}")
            print(f"       is_admin: {user.is_admin}")
            print(f"       is_active: {user.is_active}")
            
            # 测试密码
            test_password = 'admin123'
            if user.check_password(test_password):
                print(f"       密码验证: ✓ (可使用密码 '{test_password}' 登录)")
            else:
                print(f"       密码验证: ✗ (密码 '{test_password}' 不正确)")
    
    print("\n" + "=" * 50)
    print("测试登录...")
    print("=" * 50)
    
    # 测试登录
    test_user = User.query.filter_by(username='admin').first()
    if test_user:
        print(f"查找用户 'admin': ✓ 找到 (ID: {test_user.id})")
        print(f"密码验证: ", end="")
        if test_user.check_password('admin123'):
            print("✓ 正确")
        else:
            print("✗ 错误")
    else:
        print("查找用户 'admin': ✗ 未找到")
    
    print("\n" + "=" * 50)
