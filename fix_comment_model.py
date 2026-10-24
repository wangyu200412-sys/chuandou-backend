"""
修复评论模型 - 确保数据库结构正确
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

app = create_app()

with app.app_context():
    print("=== 开始修复评论模型 ===\n")
    
    # 1. 创建所有表
    db.create_all()
    print("✅ 所有表已创建/更新")
    
    # 2. 检查并添加 likes_count 字段
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    
    # 检查 comments 表
    comments_columns = [col['name'] for col in inspector.get_columns('comments')]
    print(f"\ncomments 表现有字段: {comments_columns}")
    
    if 'likes_count' not in comments_columns:
        try:
            with db.engine.connect() as conn:
                conn.execute(text('ALTER TABLE comments ADD COLUMN likes_count INTEGER DEFAULT 0'))
                conn.commit()
            print("✅ likes_count 字段已添加")
        except Exception as e:
            print(f"⚠️ 添加 likes_count 字段: {e}")
    
    # 检查 comment_likes 表
    tables = inspector.get_table_names()
    print(f"\n现有表: {tables}")
    
    if 'comment_likes' not in tables:
        print("❌ comment_likes 表不存在，正在创建...")
        # 手动创建 comment_likes 表
        with db.engine.connect() as conn:
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS comment_likes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    comment_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id),
                    FOREIGN KEY (comment_id) REFERENCES comments (id),
                    UNIQUE(user_id, comment_id)
                )
            '''))
            conn.commit()
        print("✅ comment_likes 表已创建")
    else:
        print("✅ comment_likes 表已存在")
    
    # 3. 验证表结构
    print("\n=== 验证表结构 ===")
    
    comment_likes_columns = [col['name'] for col in inspector.get_columns('comment_likes')]
    print(f"comment_likes 表字段: {comment_likes_columns}")
    
    print("\n=== 修复完成 ===")
    print("请重启后端服务使更改生效。")
