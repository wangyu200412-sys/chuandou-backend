const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

const target = `#info-panel .title {
            font-size: 22px;
            color: #FFD700;`;
const replacement = `#info-panel .title {
            font-size: 22px;
            color: #D4B984;`;

content = content.replace(/\r\n/g, '\n');
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully changed info-panel title color to #D4B984');
} else {
    console.log('Target color not found');
}

