const fs = require('fs');
const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
let content = fs.readFileSync(filepath, 'utf8');

const regex = /if \(window\.showMessage\) \{\s*window\.\s*\}/;
const replacement = `if (window.showMessage) {
                                    window.showMessage('表面函数已修复');
                                }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Fixed window.");
} else {
    console.log("Not found.");
}
