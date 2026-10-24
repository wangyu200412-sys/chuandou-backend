#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
创建管理员账户脚本
使用方法: python create_admin.py [用户名] [密码]
示例: python create_admin.py admin admin123
"""

import sys
import os

# 添加backend目录到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models import User

def create_admin(username='admin', password='admin123'):
    """创建或更新管理员账户"""
    app = create_app()
    
    with app.app_context():
        # 检查是否已存在用户
        existing_admin = User.query.filter_by(username=username).first()
        if existing_admin:
            # 如果已存在，更新为管理员并设置密码
            if not existing_admin.is_admin:
                existing_admin.is_admin = True
                print(f'[INFO] User {username} promoted to admin')
            existing_admin.set_password(password)
            db.session.commit()
            print(f'[OK] User {username} password updated')
            return existing_admin
        
        # 创建新管理员
        admin = User(
            username=username,
            email=f'{username}@admin.com',
            nickname='系统管理员',
            avatar='👑',
            is_admin=True
        )
        admin.set_password(password)
        
        db.session.add(admin)
        db.session.commit()
        
        print(f'[OK] Admin account created!')
        print(f'   Username: {username}')
        print(f'   Password: {password}')
        
        return admin

if __name__ == '__main__':
    username = sys.argv[1] if len(sys.argv) > 1 else 'admin'
    password = sys.argv[2] if len(sys.argv) > 2 else 'admin123'
    create_admin(username, password)
