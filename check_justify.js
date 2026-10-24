const fs = require('fs');
const content = fs.readFileSync('d:/backend/app/templates/chuandou-building-game.html', 'utf8');
const lines = content.split('\n');

for(let i=0; i<lines.length; i++) {
    if(lines[i].includes('justify-content')) {
        console.log(i + ': ' + lines[i]);
    }
}

