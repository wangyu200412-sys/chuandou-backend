import os

file_path = 'd:/backend/app/templates/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    '穿斗营\ufffd/a>': '穿斗营造</a>',
    '建筑生长\ufffd..': '建筑生长中...',
    '现在生长的是\ufffd..': '现在生长的是...',
    '<h4>\ufffd/h4>': '<h4>柱</h4>',
    '\ufffd },': "。' },",
    "构件分类\ufffd": "构件分类：'",
    "开始加\ufffd${totalCount} \ufffdGLB": "开始加载 ${totalCount} 个 GLB",
    "加载完成！成\ufffd ${loadedCount}": "加载完成！成功: ${loadedCount}",
    "现在生长的是\ufffd": "现在生长的是：\""
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed moji-bake in index.html")

