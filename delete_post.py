import sqlite3

db_path = "chuandou.db"

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Delete post with id 1
    cursor.execute("DELETE FROM posts WHERE id = 1;")
    conn.commit()
    print("Deleted post with id 1")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    if 'conn' in locals():
        conn.close()

