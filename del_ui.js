const fs = require('fs');

const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
let content = fs.readFileSync(filepath, 'utf8');

// Remove the particle-fix-panel div
const pattern1 = /<div id="particle-fix-panel"[\s\S]*?<\/div>/;
content = content.replace(pattern1, '');

// Remove the script block
const pattern2 = /<script>\s*function showMessage\(text\)[\s\S]*?window\.checkParticleStatus = function\(\) \{[\s\S]*?\};\s*<\/script>/;
content = content.replace(pattern2, '');

// Remove button injection
const pattern3 = /const panel = document\.getElementById\('particle-fix-panel'\);[\s\S]*?buttonsDiv\.appendChild\(newButton\);\s*\}\s*\}/;
content = content.replace(pattern3, '');

// Remove all showMessage calls
content = content.replace(/showMessage\('.*?'\);/g, '');

fs.writeFileSync(filepath, content, 'utf8');
console.log("Done");
