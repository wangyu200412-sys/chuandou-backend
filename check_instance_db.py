"""
检查 instance 目录下的数据库
"""
import os
import sys

# 直接使用 SQLite 查询 instance 目录下的数据库
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance', 'chuandou.db')

print(f"检查数据库: {db_path}")
print(f"文件存在: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    import sqlite3
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 查询用户
    cursor.execute("SELECT id, username, email, is_admin, is_active FROM users")
    users = cursor.fetchall()
    
    print("\n=== instance/chuandou.db 中的用户 ===")
    for user in users:
        print(f"ID:{user[0]} | {user[1]} | {user[2]} | is_admin:{user[3]} | is_active:{user[4]}")
    
    conn.close()
else:
    print("数据库文件不存在")
