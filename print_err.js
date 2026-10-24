const fs = require('fs');
const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
const content = fs.readFileSync(filepath, 'utf8');

const errIndex = 459963;
const start = Math.max(0, errIndex - 500);
const end = Math.min(content.length, errIndex + 500);

console.log(content.substring(start, end));
