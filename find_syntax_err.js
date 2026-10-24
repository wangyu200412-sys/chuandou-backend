const fs = require('fs');
const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
const content = fs.readFileSync(filepath, 'utf8');

const scriptRegex = /<script.*?>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(content)) !== null) {
    i++;
    if (i === 4) {
        const code = match[1];
        try {
            new Function(code);
        } catch (e) {
            console.log(`Error: ${e.message}`);
            // e.stack or we can just catch it differently.
            // A better way to find the line of syntax error in Node:
            const { parse } = require('acorn');
            try {
                parse(code, { ecmaVersion: 2020 });
            } catch (err) {
                console.log(`Syntax Error at line ${err.loc.line}, column ${err.loc.column}`);
                const lines = code.split('\n');
                for (let j = Math.max(0, err.loc.line - 5); j < Math.min(lines.length, err.loc.line + 5); j++) {
                    console.log(`${j+1}: ${lines[j]}`);
                }
            }
        }
    }
}
