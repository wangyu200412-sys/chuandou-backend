const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

const cancelTarget = `            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });`;
const cancelReplacement = `            cancelBtn.addEventListener('click', () => {
                modal.style.display = 'none';
                
                const allMeshes = [...columns, ...beams, ...guazhuArray, ...roofs];
                allMeshes.forEach(mesh => {
                    if (mesh.material) {
                        mesh.material.opacity = 1;
                        mesh.material.transparent = false;
                        mesh.material.depthWrite = true;
                        mesh.material.wireframe = false;
                        if(mesh.material.emissiveIntensity !== undefined) {
                            mesh.material.emissiveIntensity = 0;
                        }
                    }
                    if (mesh.userData.originalPosition) {
                        mesh.position.copy(mesh.userData.originalPosition);
                    }
                    if (mesh.userData.originalRotation) {
                        mesh.rotation.copy(mesh.userData.originalRotation);
                    }
                    if (mesh.userData.originalScale) {
                        mesh.scale.copy(mesh.userData.originalScale);
                    }
                });
                
                const controlsEl = document.getElementById('tour-controls');
                if(controlsEl) controlsEl.classList.add('visible');
                
                const techHud = document.getElementById('tech-hud');
                if(techHud) techHud.style.display = 'none';
                
                const miniChart = document.getElementById('echarts-mini-chart');
                if (miniChart) miniChart.style.display = 'none';
            });`;

// Ensure we match correctly regardless of line endings
const cleanContent = content.replace(/\r\n/g, '\n');
if (cleanContent.includes(cancelTarget)) {
    content = cleanContent.replace(cancelTarget, cancelReplacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Cancel listener updated.');
} else {
    console.log('Cancel listener target not found.');
}

