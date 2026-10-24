"""查看所有用户"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app, db
from app.models import User

def list_users():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        print('=' * 60)
        print(f'{"用户名":<15} {"昵称":<15} {"邮箱":<25} {"管理员"}')
        print('-' * 60)
        for u in users:
            print(f'{u.username:<15} {u.nickname:<15} {u.email:<25} {"是" if u.is_admin else "否"}')
        print('=' * 60)
        print(f'共 {len(users)} 个用户')

if __name__ == "__main__":
    list_users()
