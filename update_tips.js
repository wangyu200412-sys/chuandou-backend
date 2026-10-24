const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

// 1. Update the CSS for #interaction-tips
const cssTarget = `#interaction-tips {
            position: fixed;`;
const cssReplacement = `#interaction-tips {
            opacity: 0;
            transition: opacity 1s ease;
            position: fixed;`;

// 2. Update the CSS to add .visible class
const cssVisibleTarget = `#interaction-tips .tips-title {`;
const cssVisibleReplacement = `#interaction-tips.visible {
            opacity: 1;
        }
        #interaction-tips .tips-title {`;

// 3. Update cancelBtn listener to show interaction-tips
const cancelTarget = `const controlsEl = document.getElementById('tour-controls');
                if(controlsEl) controlsEl.classList.add('visible');`;
const cancelReplacement = `const controlsEl = document.getElementById('tour-controls');
                if(controlsEl) controlsEl.classList.add('visible');
                
                const tipsEl = document.getElementById('interaction-tips');
                if(tipsEl) tipsEl.classList.add('visible');`;

// 4. Update the end of playGrowthAnimation to show interaction-tips
// It should be around where 'tour-controls' is made visible in playGrowthAnimation
const animEndTarget = `document.getElementById('tour-controls').classList.add('visible');
                updateHUD("完整建筑", "COMPLETE");`;
const animEndReplacement = `document.getElementById('tour-controls').classList.add('visible');
                const tipsEl = document.getElementById('interaction-tips');
                if(tipsEl) tipsEl.classList.add('visible');
                updateHUD("完整建筑", "COMPLETE");`;

content = content.replace(/\r\n/g, '\n');
content = content.replace(cssTarget, cssReplacement);
content = content.replace(cssVisibleTarget, cssVisibleReplacement);
content = content.replace(cancelTarget, cancelReplacement);
if(content.includes(animEndTarget)) {
    content = content.replace(animEndTarget, animEndReplacement);
} else {
    // try a more loose match
    const animEndTarget2 = `document.getElementById('tour-controls').classList.add('visible');`;
    const animEndReplacement2 = `document.getElementById('tour-controls').classList.add('visible');
                const tipsEl = document.getElementById('interaction-tips');
                if(tipsEl) tipsEl.classList.add('visible');`;
    content = content.replace(animEndTarget2, animEndReplacement2);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Interaction tips visibility updated.');

