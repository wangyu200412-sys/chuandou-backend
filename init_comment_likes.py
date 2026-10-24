"""
初始化评论点赞表
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db

app = create_app()

with app.app_context():
    # 创建所有新表和列
    db.create_all()
    print("✅ 数据库表创建成功")
    
    # 检查 comments 表是否有 likes_count 字段
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    columns = [col['name'] for col in inspector.get_columns('comments')]
    
    if 'likes_count' not in columns:
        try:
            # 添加 likes_count 字段
            db.session.execute(db.text('ALTER TABLE comments ADD COLUMN likes_count INTEGER DEFAULT 0'))
            db.session.commit()
            print("✅ comments 表 likes_count 字段添加成功")
        except Exception as e:
            print(f"⚠️ 添加字段失败（可能已存在）: {e}")
    else:
        print("✅ comments 表已有 likes_count 字段")
    
    # 检查 comment_likes 表是否存在
    tables = inspector.get_table_names()
    if 'comment_likes' not in tables:
        print("❌ comment_likes 表不存在，请确保数据库已正确创建")
    else:
        print("✅ comment_likes 表存在")
    
    print("\n初始化完成！请重启后端服务。")
