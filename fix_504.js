const fs = require('fs');
let content = fs.readFileSync('d:/backend/app/templates/index.html', 'utf8');
content = content.split('审美价值\ufffd? }').join("审美价值。' }");
fs.writeFileSync('d:/backend/app/templates/index.html', content, 'utf8');

