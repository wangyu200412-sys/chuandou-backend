"""
一次性迁移脚本：把本地 SQLite (chuandou.db) 的数据搬到 Postgres（Supabase / Render Postgres）

设计要点：
- 只做数据搬迁，不改动任何业务代码
- 目标库表结构由 app 的 ORM 元数据创建（db.create_all），保证与线上一致
- 源库用反射读取，不需要手写表名
- 按外键依赖顺序插入，插入前清空目标表，可重复执行
- 迁移后重置 Postgres 自增序列，避免新数据主键冲突

用法（本地或 Render Shell 均可）：

    set DATABASE_URL=postgresql://postgres.xxx:密码@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
    python migrate_sqlite_to_pg.py

常用参数：
    --sqlite   源 SQLite 文件路径，默认项目根目录 chuandou.db
    --dry-run  只统计各表行数，不写入目标库
"""
import os
import sys
import argparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, MetaData, Table, text, inspect

from app import create_app, db
from app.utils.env import load_local_env

load_local_env()


def build_source_engine(sqlite_path):
    if not os.path.exists(sqlite_path):
        raise SystemExit(f"[ERROR] 找不到源数据库文件：{sqlite_path}")
    return create_engine(f"sqlite:///{sqlite_path}")


def ordered_tables(engine):
    """按外键依赖顺序返回表对象（父表在前）"""
    meta = MetaData()
    meta.reflect(bind=engine)
    return meta.sorted_tables


def table_rows(engine, table):
    with engine.connect() as conn:
        result = conn.execute(table.select())
        cols = list(result.keys())
        return cols, [dict(zip(cols, row)) for row in result.mappings()]


def truncate_target(conn, tables):
    """清空目标表，按依赖逆序删除"""
    for table in reversed(tables):
        conn.execute(text(f'TRUNCATE TABLE "{table.name}" CASCADE'))


def reset_sequences(conn, tables):
    """重置 Postgres 自增序列，避免插入后新记录主键冲突"""
    fixed = []
    for table in tables:
        pk_cols = [c.name for c in table.primary_key.columns]
        if len(pk_cols) != 1:
            continue
        pk = pk_cols[0]
        col = table.columns[pk]
        if not str(getattr(col.type, "python_type", int)).lower().startswith("int"):
            continue
        try:
            conn.execute(
                text(
                    "SELECT setval(pg_get_serial_sequence(:t, :c), "
                    "GREATEST(COALESCE((SELECT MAX(\"{c}\") FROM \"{t}\"), 0), 1), "
                    "COALESCE((SELECT MAX(\"{c}\") FROM \"{t}\"), 0) > 0)".replace("{c}", pk).replace("{t}", table.name)
                ),
                {"t": table.name, "c": pk},
            )
            fixed.append(table.name)
        except Exception:
            conn.rollback()
    return fixed


def main():
    parser = argparse.ArgumentParser(description="SQLite -> Postgres 数据迁移")
    parser.add_argument("--sqlite", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "chuandou.db"))
    parser.add_argument("--dry-run", action="store_true", help="只统计行数，不写入目标库")
    args = parser.parse_args()

    app = create_app(os.getenv("FLASK_ENV", "development"))
    target_url = app.config.get("SQLALCHEMY_DATABASE_URI", "")

    if "postgres" not in target_url:
        raise SystemExit(
            "[ERROR] 目标数据库不是 Postgres。请先设置环境变量 DATABASE_URL，例如：\n"
            "  DATABASE_URL=postgresql://user:pass@host:5432/postgres\n"
            f"当前解析到的地址是：{target_url}"
        )

    src_engine = build_source_engine(args.sqlite)
    src_tables = ordered_tables(src_engine)

    print(f"[INFO] 源库：{args.sqlite}")
    print(f"[INFO] 目标库：{target_url.split('@')[-1]}")
    print(f"[INFO] 发现 {len(src_tables)} 张表：{', '.join(t.name for t in src_tables)}")

    with app.app_context():
        if args.dry_run:
            for table in src_tables:
                cols, rows = table_rows(src_engine, table)
                print(f"[DRY-RUN] {table.name}: {len(rows)} 行")
            print("[INFO] dry-run 结束，未写入任何数据")
            return

        db.create_all()
        print("[INFO] 目标库表结构已就绪")

        target_engine = db.engine
        total = 0
        with target_engine.begin() as conn:
            truncate_target(conn, src_tables)
            for table in src_tables:
                cols, rows = table_rows(src_engine, table)
                if not rows:
                    print(f"[INFO] {table.name}: 0 行，跳过")
                    continue
                target_table = Table(table.name, MetaData(), autoload_with=target_engine)
                conn.execute(target_table.insert(), rows)
                total += len(rows)
                print(f"[INFO] {table.name}: 已迁移 {len(rows)} 行")
            seq_fixed = reset_sequences(conn, src_tables)

        print(f"[INFO] 迁移完成，共 {total} 行")
        if seq_fixed:
            print(f"[INFO] 已重置自增序列：{', '.join(seq_fixed)}")
        print("[NEXT] 到 Supabase SQL Editor 或 psql 执行 SELECT count(*) FROM users; 抽查核对")


if __name__ == "__main__":
    main()
