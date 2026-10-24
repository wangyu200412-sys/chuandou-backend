"""
修复 instance 数据库 - 添加 admin 用户
"""
import os
import sys

# 直接使用 SQLite 操作 instance 目录下的数据库
instance_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'chuandou.db')
backend_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chuandou.db')

print(f"Backend数据库: {backend_db_path}")
print(f"Instance数据库: {instance_db_path}")

# 检查并复制密码哈希
import sqlite3

# 从 backend/chuandou.db 获取 admin 用户信息
if os.path.exists(backend_db_path):
    conn_backend = sqlite3.connect(backend_db_path)
    cursor = conn_backend.cursor()
    cursor.execute("""
        SELECT id, username, email, password_hash, avatar, nickname, bio, is_admin, is_active, created_at, updated_at 
        FROM users WHERE username = 'admin'
    """)
    admin = cursor.fetchone()
    conn_backend.close()
    
    if admin:
        print(f"\n从 backend 数据库获取 admin 用户:")
        print(f"  ID: {admin[0]}")
        print(f"  用户名: {admin[1]}")
        print(f"  is_admin: {admin[7]}")
        print(f"  is_active: {admin[8]}")
        
        # 检查 instance 数据库
        if os.path.exists(instance_db_path):
            conn_instance = sqlite3.connect(instance_db_path)
            cursor_instance = conn_instance.cursor()
            
            # 检查 admin 是否存在
            cursor_instance.execute("SELECT id, username, is_admin FROM users WHERE username = 'admin'")
            existing = cursor_instance.fetchone()
            
            if existing:
                print(f"\nInstance数据库已有 admin 用户:")
                print(f"  ID: {existing[0]}, is_admin: {existing[2]}")
                
                # 更新 is_admin 状态
                if not existing[2]:
                    cursor_instance.execute("UPDATE users SET is_admin = 1 WHERE username = 'admin'")
                    conn_instance.commit()
                    print("✅ 已更新 admin 为管理员")
                else:
                    print("✅ admin 已是管理员")
            else:
                print("\n❌ Instance数据库没有 admin 用户，需要创建")
                # 插入 admin 用户
                cursor_instance.execute("""
                    INSERT INTO users (username, email, password_hash, avatar, nickname, bio, is_admin, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, admin[1:])  # 跳过 id 字段，让数据库自动生成
                conn_instance.commit()
                print("✅ 已创建 admin 用户")
            
            conn_instance.close()
        else:
            print(f"\n❌ Instance数据库不存在: {instance_db_path}")
    else:
        print("❌ Backend数据库中没有 admin 用户")
else:
    print(f"❌ Backend数据库不存在: {backend_db_path}")

print("\n检查完成！")
