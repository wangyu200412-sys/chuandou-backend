const fs = require('fs');
let content = fs.readFileSync('d:/backend/app/templates/index.html', 'utf8');

content = content.replace('<h3 id="hud-title">现在生长的是："?..</h3>', '<h3 id="hud-title">现在生长的是...</h3>');
content = content.replace('hudTitle.textContent = "现在生长的是："? + chineseName;', 'hudTitle.textContent = "现在生长的是：" + chineseName;');

fs.writeFileSync('d:/backend/app/templates/index.html', content, 'utf8');
console.log('Fixed HUD titles');

