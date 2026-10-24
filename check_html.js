const fs = require('fs');
const content = fs.readFileSync('d:/backend/app/templates/chuandou-building-game.html', 'utf8');
const lines = content.split('\n');
const startIndex = lines.findIndex(l => l.includes('id="leftPanel"'));
console.log(lines.slice(startIndex, startIndex + 20).join('\n'));

