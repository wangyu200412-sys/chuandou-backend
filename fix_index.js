const fs = require('fs');
const filePath = 'd:/backend/app/templates/index.html';

let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
    '穿斗营\ufffd?/a>': '穿斗营造</a>',
    '建筑生长\ufffd?..': '建筑生长中...',
    '现在生长的是\ufffd?..': '现在生长的是...',
    '<h4>\ufffd?/h4>': '<h4>柱</h4>',
    '\ufffd? },': "。' },",
    "构件分类\ufffd?": "构件分类：'",
    "开始加\ufffd?${totalCount} \ufffd?GLB": "开始加载 ${totalCount} 个 GLB",
    "加载完成！成\ufffd? ${loadedCount}": "加载完成！成功: ${loadedCount}",
    "现在生长的是\ufffd?": "现在生长的是：\""
};

for (const [oldStr, newStr] of Object.entries(replacements)) {
    content = content.split(oldStr).join(newStr);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Fixed moji-bake in index.html");

