const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/0xFFD700/g, '0xD4B984');

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced 0xFFD700 with 0xD4B984');

