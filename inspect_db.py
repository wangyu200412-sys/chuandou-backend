import sqlite3
import sys

db_path = "chuandou.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("Tables:")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    for table in tables:
        print(table[0])
        
    print("\nExploring posts or messages table if it exists:")
    for table_name in ["posts", "messages", "square_posts", "post", "Post", "square_post", "Posts"]:
        if any(t[0] == table_name for t in tables):
            print(f"\nTable {table_name}:")
            cursor.execute(f"PRAGMA table_info({table_name})")
            columns = cursor.fetchall()
            print("Columns:", [col[1] for col in columns])
            
            cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
            rows = cursor.fetchall()
            for row in rows:
                print(row)
                
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()

