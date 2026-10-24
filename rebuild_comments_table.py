"""
重建 comments 表 - 添加 likes_count 字段
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=== 重建 comments 表 ===\n")
    
    # 获取数据库路径
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    print(f"数据库路径: {db_path}")
    print(f"文件存在: {os.path.exists(db_path)}")
    
    import sqlite3
    
    # 连接数据库
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # 1. 检查现有表结构
    cursor.execute("PRAGMA table_info(comments)")
    columns = cursor.fetchall()
    print(f"\n当前 comments 表结构:")
    for col in columns:
        print(f"  - {col[1]}: {col[2]}")
    
    # 2. 检查是否有 likes_count 列
    column_names = [col[1] for col in columns]
    
    if 'likes_count' not in column_names:
        print("\n添加 likes_count 列...")
        try:
            cursor.execute("ALTER TABLE comments ADD COLUMN likes_count INTEGER DEFAULT 0")
            conn.commit()
            print("✅ likes_count 列添加成功")
        except Exception as e:
            print(f"❌ 添加失败: {e}")
    else:
        print("\n✅ likes_count 列已存在")
    
    # 3. 检查 comment_likes 表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='comment_likes'")
    if cursor.fetchone():
        print("✅ comment_likes 表已存在")
    else:
        print("\n创建 comment_likes 表...")
        cursor.execute('''
            CREATE TABLE comment_likes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                comment_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (comment_id) REFERENCES comments (id),
                UNIQUE(user_id, comment_id)
            )
        ''')
        conn.commit()
        print("✅ comment_likes 表创建成功")
    
    # 4. 验证最终结果
    cursor.execute("PRAGMA table_info(comments)")
    final_columns = cursor.fetchall()
    print(f"\n最终 comments 表结构:")
    for col in final_columns:
        print(f"  - {col[1]}: {col[2]}")
    
    conn.close()
    
    print("\n=== 完成 ===")
    print("请重启后端服务。")
