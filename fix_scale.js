const fs = require('fs');
let content = fs.readFileSync('d:/backend/app/templates/index.html', 'utf8');

const oldCode = `            mesh.userData.originalScale = mesh.scale.clone();`;
const newCode = `            if (!mesh.userData.originalScale) {
                mesh.userData.originalScale = mesh.scale.clone();
            }`;

content = content.replace(oldCode, newCode);

fs.writeFileSync('d:/backend/app/templates/index.html', content, 'utf8');
console.log('Fixed setupComponentAsSky');

