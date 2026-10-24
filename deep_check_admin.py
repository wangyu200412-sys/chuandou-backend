"""
数据库管理员状态深度检查
直接查询SQLite数据库验证管理员配置
"""
import sys
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'chuandou.db')

def print_header(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def print_row(label, value, status=None):
    icons = {
        'ok': '✓',
        'error': '✗',
        'warn': '⚠',
        'info': 'ℹ'
    }
    icon = icons.get(status, ' ')
    print(f"{icon} {label}: {value}")

def check_database():
    """直接检查SQLite数据库"""
    print_header("1. SQLite数据库检查")
    
    if not os.path.exists(DB_PATH):
        print_row("数据库文件", f"不存在: {DB_PATH}", "error")
        return False
    
    size = os.path.getsize(DB_PATH)
    print_row("数据库路径", DB_PATH, "ok")
    print_row("文件大小", f"{size} bytes", "ok" if size > 0 else "error")
    
    return True

def check_tables():
    """检查数据库表结构"""
    print_header("2. 数据表结构检查")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 获取所有表
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    
    print_row("数据表数量", len(tables), "ok")
    print("  表列表:")
    for table in tables:
        print(f"    - {table[0]}")
    
    # 检查users表结构
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    
    print("\n  users表字段:")
    has_is_admin = False
    has_is_active = False
    for col in columns:
        col_name = col[1]
        col_type = col[2]
        nullable = "NOT NULL" if col[3] else "NULL"
        default = col[4]
        print(f"    {col_name}: {col_type} {nullable} DEFAULT {default}")
        
        if col_name == 'is_admin':
            has_is_admin = True
        if col_name == 'is_active':
            has_is_active = True
    
    if not has_is_admin:
        print_row("is_admin字段", "不存在!", "error")
    else:
        print_row("is_admin字段", "存在", "ok")
    
    if not has_is_active:
        print_row("is_active字段", "不存在!", "error")
    else:
        print_row("is_active字段", "存在", "ok")
    
    conn.close()
    return has_is_admin and has_is_active

def check_users():
    """检查用户数据"""
    print_header("3. 用户数据检查")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 获取所有用户
    cursor.execute("SELECT id, username, email, is_admin, is_active, avatar FROM users")
    users = cursor.fetchall()
    
    print_row("用户总数", len(users), "ok" if len(users) > 0 else "warn")
    
    if len(users) == 0:
        print("\n  ⚠ 数据库中没有用户!")
        print("  请运行: python init_db.py --create-admin")
        conn.close()
        return False
    
    print("\n  用户详情:")
    admin_found = False
    for user in users:
        user_id, username, email, is_admin, is_active, avatar = user
        
        # 判断状态
        admin_tag = "👑" if is_admin else "👤"
        active_tag = "" if is_active else " (已禁用)"
        
        print(f"\n  [{user_id}] {username} {admin_tag}{active_tag}")
        print(f"      email: {email}")
        print(f"      is_admin: {is_admin} (type: {type(is_admin).__name__})")
        print(f"      is_active: {is_active}")
        print(f"      avatar: {avatar}")
        
        if username == 'admin':
            admin_found = True
            print(f"      ★ 管理员账号配置:")
            print(f"        - is_admin == True: {is_admin == True}")
            print(f"        - is_active == True: {is_active == True}")
            
            if is_admin != True:
                print(f"        ⚠ is_admin 应为 True，当前为 {is_admin}")
            if is_active != True:
                print(f"        ⚠ is_active 应为 True，当前为 {is_active}")
    
    conn.close()
    
    return admin_found

def check_admin_directly():
    """直接查询admin用户的详细状态"""
    print_header("4. Admin用户详细检查")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT 
            id, 
            username, 
            email, 
            password_hash,
            is_admin,
            is_active,
            avatar,
            nickname,
            created_at
        FROM users 
        WHERE username = 'admin'
    """)
    
    result = cursor.fetchone()
    
    if result is None:
        print_row("Admin用户", "不存在", "error")
        print("\n  创建admin用户:")
        print("    python init_db.py --create-admin")
        conn.close()
        return False
    
    print("\n  Admin用户完整数据:")
    print(f"    id: {result[0]}")
    print(f"    username: {result[1]}")
    print(f"    email: {result[2]}")
    print(f"    password_hash: {result[3][:30]}...")
    print(f"    is_admin: {result[4]} (Python值: {result[4] == True})")
    print(f"    is_active: {result[5]} (Python值: {result[5] == True})")
    print(f"    avatar: {result[6]}")
    print(f"    nickname: {result[7]}")
    print(f"    created_at: {result[8]}")
    
    # 验证类型
    print("\n  类型验证:")
    print(f"    type(result[4]): {type(result[4])}")
    print(f"    result[4] == True: {result[4] == True}")
    print(f"    result[4] is True: {result[4] is True}")
    print(f"    bool(result[4]): {bool(result[4])}")
    
    if result[4] == True:
        print("\n  ✓ is_admin 配置正确!")
    else:
        print(f"\n  ✗ is_admin 配置错误! 当前值: {result[4]}")
    
    conn.close()
    return result[4] == True

def fix_admin():
    """修复admin用户的管理员状态"""
    print_header("修复admin用户")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 检查admin是否存在
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    result = cursor.fetchone()
    
    if result is None:
        print("  Admin用户不存在，创建新用户...")
        
        # 导入密码生成
        import hashlib
        import secrets
        
        # 生成密码哈希
        password = 'admin123'
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac(
            'sha256', 
            password.encode('utf-8'), 
            salt.encode('utf-8'), 
            100000
        ).hex()
        # werkzeug格式: method$salt$hash
        full_hash = f"pbkdf2:sha256:100000${salt}${password_hash}"
        
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, is_admin, is_active, avatar, nickname)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, ('admin', 'admin@chuandou.com', full_hash, 1, 1, '👑', '管理员'))
        
        conn.commit()
        print("  ✓ Admin用户创建成功!")
        print("    用户名: admin")
        print("    密码: admin123")
        
    else:
        print("  Admin用户已存在，更新管理员状态...")
        cursor.execute("""
            UPDATE users 
            SET is_admin = 1, is_active = 1
            WHERE username = 'admin'
        """)
        conn.commit()
        print("  ✓ 管理员状态已更新!")
    
    conn.close()

def test_password():
    """测试admin密码"""
    print_header("测试admin密码")
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("SELECT password_hash FROM users WHERE username = 'admin'")
    result = cursor.fetchone()
    
    if result is None:
        print_row("Admin用户", "不存在", "error")
        conn.close()
        return False
    
    password_hash = result[0]
    print_row("密码哈希", password_hash[:50] + "...")
    
    # 使用werkzeug验证
    try:
        from werkzeug.security import check_password_hash
        is_valid = check_password_hash(password_hash, 'admin123')
        print_row("密码 'admin123' 验证", "通过 ✓" if is_valid else "失败 ✗", "ok" if is_valid else "error")
        conn.close()
        return is_valid
    except Exception as e:
        print_row("验证过程出错", str(e), "error")
        conn.close()
        return False

def main():
    print("\n" + "=" * 60)
    print("    管理员账户深度检查工具")
    print("=" * 60)
    
    # 1. 检查数据库
    if not check_database():
        print("\n请先初始化数据库!")
        return
    
    # 2. 检查表结构
    tables_ok = check_tables()
    
    # 3. 检查用户
    check_users()
    
    # 4. 详细检查admin
    admin_ok = check_admin_directly()
    
    # 5. 测试密码
    password_ok = test_password()
    
    # 总结
    print_header("检查总结")
    print(f"  数据库: ✓")
    print(f"  表结构: {'✓' if tables_ok else '✗'}")
    print(f"  Admin配置: {'✓' if admin_ok else '✗'}")
    print(f"  密码验证: {'✓' if password_ok else '✗'}")
    
    if not admin_ok or not password_ok:
        print("\n发现问题，是否修复? (运行 python check_db.py --fix)")
    
    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
