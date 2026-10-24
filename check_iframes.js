const fs = require('fs');
const content = fs.readFileSync('d:/backend/app/templates/fullpage.html', 'utf8');
const iframes = content.match(/<iframe[^>]+src=["'][^"']+["'][^>]*>/g);
console.log(iframes);

