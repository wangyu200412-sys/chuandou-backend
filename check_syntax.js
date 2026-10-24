const fs = require('fs');
const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
const content = fs.readFileSync(filepath, 'utf8');

// Extract script tags
const scriptRegex = /<script.*?>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(content)) !== null) {
    i++;
    const code = match[1];
    try {
        // use Function constructor to parse (it will throw if invalid syntax)
        new Function(code);
    } catch (e) {
        console.log(`Syntax error in script tag #${i} at index ${match.index}: ${e.message}`);
    }
}
console.log('Syntax check complete');
