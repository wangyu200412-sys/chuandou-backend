const fs = require('fs');
const filePath = 'd:/backend/app/templates/index.html';

let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove 【否】 from the tour buttons
content = content.replace('俯瞰全局【否】', '俯瞰全局');
content = content.replace('穿斗剖面【否】', '穿斗剖面');
content = content.replace('默认视角【否】', '默认视角');

// 2. Remove the entire button for btn-view-detail
const lines = content.split('\n');
const newLines = lines.filter(line => !line.includes('id="btn-view-detail"'));
content = newLines.join('\n');

// 3. Remove JS references to btn-view-detail
content = content.replace("const btnDetail = document.getElementById('btn-view-detail');\n", "");
content = content.replace("if(btnDetail) btnDetail.addEventListener('click', () => moveToView({x: 4, y: 5.5, z: 4}, {x: 0, y: 5.5, z: 0}));\n", "");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed 【否】 and btn-view-detail');

