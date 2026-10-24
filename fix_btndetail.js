const fs = require('fs');
const filePath = 'd:/backend/app/templates/index.html';

let content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
const newLines = lines.filter(line => !line.includes('btnDetail'));
content = newLines.join('\n');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Removed btnDetail JS');

