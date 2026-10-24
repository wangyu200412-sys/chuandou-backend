import re

file_path = 'app/static/css/square.css'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find .empty-state::before and its block
pattern = r'\.empty-state::before\s*\{[^}]*\}'
new_content = re.sub(pattern, '', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Removed .empty-state::before block from square.css")

