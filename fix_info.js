const fs = require('fs');
let content = fs.readFileSync('d:/backend/app/templates/index.html', 'utf8');

content = content.replace("infoCategory.textContent = '构件分类：'? + info.category;", "infoCategory.textContent = '构件分类：' + info.category;");

fs.writeFileSync('d:/backend/app/templates/index.html', content, 'utf8');
console.log('Fixed infoCategory');

