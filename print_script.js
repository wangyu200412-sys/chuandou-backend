const fs = require('fs');
const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
const content = fs.readFileSync(filepath, 'utf8');

const scriptRegex = /<script.*?>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(content)) !== null) {
    i++;
    if (i === 4) {
        const lines = match[1].split('\n');
        lines.forEach((line, idx) => {
            console.log(`${idx + 1}: ${line}`);
        });
    }
}
