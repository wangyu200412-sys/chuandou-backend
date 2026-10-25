"""
生成 Supabase 的 DATABASE_URL，并可选直接试连验证。

用法（在 D:\backend 目录下）：
    python build_db_url.py                 # 交互式输入密码，输出连接串
    python build_db_url.py --test          # 生成后立刻试连，确认能通

说明：
- 密码不会写进代码或文件，只在运行时输入
- 密码中的 @ # % & + / ? = 等字符会自动做百分号编码，避免连接串被解析错
"""
import argparse
import getpass
import sys
import urllib.parse

# 你的 Supabase 项目参数（非密钥，可按需修改）
DEFAULT_USER = "postgres.akurxomqaylzfipnvatx"
DEFAULT_HOST = "aws-0-ap-northeast-1.pooler.supabase.com"
DEFAULT_PORT = 5432
DEFAULT_DB = "postgres"


def build_url(user, host, port, db, password):
    safe_pw = urllib.parse.quote(password, safe="")
    return f"postgresql://{user}:{safe_pw}@{host}:{port}/{db}"


def main():
    parser = argparse.ArgumentParser(description="生成并校验 Supabase DATABASE_URL")
    parser.add_argument("--password", help="数据库密码（不推荐在命令行传入，会留在历史里）")
    parser.add_argument("--test", action="store_true", help="生成后立即尝试连接")
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--user", default=DEFAULT_USER)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--db", default=DEFAULT_DB)
    args = parser.parse_args()

    password = args.password or getpass.getpass("请输入 Supabase 数据库密码（输入不回显）: ")
    if not password:
        print("[ERROR] 密码不能为空")
        sys.exit(1)

    url = build_url(args.user, args.host, args.port, args.db, password)

    if args.test:
        try:
            import psycopg2
        except ImportError:
            print("[ERROR] 缺少 psycopg2，先执行 pip install psycopg2-binary")
            sys.exit(1)
        try:
            conn = psycopg2.connect(url.replace("postgresql://", "postgresql://"), sslmode="require", connect_timeout=15)
            with conn.cursor() as cur:
                cur.execute("SELECT version();")
                version = cur.fetchone()[0]
            conn.close()
            print("[OK] 数据库连接成功")
            print("     " + version.split(",")[0])
        except Exception as exc:
            print("[FAIL] 连接失败: %s" % exc)
            print("       常见原因：密码没填对 / 密码特殊字符没编码 / 项目被暂停")
            sys.exit(2)

    print("\nDATABASE_URL（复制下面整行，填到 Render）：\n")
    print(url)
    print("\n提示：这串等于数据库钥匙，不要贴到公开场合。")


if __name__ == "__main__":
    main()
