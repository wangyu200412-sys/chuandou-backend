const fs = require('fs');
let c = fs.readFileSync('d:/backend/app/templates/fullpage.html', 'utf8');

const lines = c.split('\n');
const fixLines = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('eforeunload') || lines[i].includes('window.addEventListener') && lines[i].includes('\\n')) {
        fixLines.push("        window.addEventListener('beforeunload', () => window.scrollTo(0,0));");
    } else {
        fixLines.push(lines[i]);
    }
}

fs.writeFileSync('d:/backend/app/templates/fullpage.html', fixLines.join('\n'), 'utf8');
console.log('Fixed fullpage.html');
