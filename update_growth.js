const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

const target = `        animationTimeline.call(() => {
            const tourControls = document.getElementById('tour-controls');
            if(tourControls) {
                tourControls.classList.add('visible');
            }
        }, null, 'roof+=4.0');`;

const replacement = `        animationTimeline.call(() => {
            const tourControls = document.getElementById('tour-controls');
            if(tourControls) {
                tourControls.classList.add('visible');
            }
            const tipsEl = document.getElementById('interaction-tips');
            if(tipsEl) {
                tipsEl.classList.add('visible');
            }
        }, null, 'roof+=4.0');`;

content = content.replace(/\r\n/g, '\n');
if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully updated playGrowthAnimation');
} else {
    console.log('Target not found in playGrowthAnimation');
}

