const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

const target = `#interaction-tips .tips-title {
            color: #FFD700;`;
const replacement = `#interaction-tips .tips-title {
            color: #D4B984;`;

content = content.replace(/\r\n/g, '\n');
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully changed title color to #D4B984');
} else {
    console.log('Target color not found');
}

