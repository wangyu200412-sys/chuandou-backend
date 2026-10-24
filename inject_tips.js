const fs = require('fs');
const path = 'd:/backend/app/templates/index.html';
let content = fs.readFileSync(path, 'utf8');

const styleTarget = `        }
    </style>`;
const styleReplacement = `        }
        #interaction-tips {
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(255, 253, 240, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(166, 139, 91, 0.4);
            border-radius: 8px;
            padding: 15px 20px;
            color: #e8d5b0;
            font-family: 'Noto Serif SC', serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
            pointer-events: none;
        }
        #interaction-tips .tips-title {
            color: #FFD700;
            font-size: 14px;
            margin-bottom: 8px;
            border-bottom: 1px solid rgba(166, 139, 91, 0.4);
            padding-bottom: 6px;
            font-weight: bold;
        }
        #interaction-tips .tips-item {
            font-size: 13px;
            color: #c9b896;
            margin-bottom: 4px;
            line-height: 1.5;
        }
        #interaction-tips .tips-item:last-child {
            margin-bottom: 0;
        }
    </style>`;

// Replace \r\n with \n in content for easier matching, then restore later if needed, or just let it be \n.
content = content.replace(/\r\n/g, '\n');

if (content.includes(styleTarget)) {
    content = content.replace(styleTarget, styleReplacement);
    console.log('Style replaced.');
} else {
    console.log('Style target not found.');
}

const htmlTarget = `    </div>

    <div id="tech-hud">`;
const htmlReplacement = `    </div>

    <div id="interaction-tips">
        <div class="tips-title">提示：欢迎体验穿斗式建筑3D交互模型</div>
        <div class="tips-item">鼠标拖拽：旋转模型</div>
        <div class="tips-item">鼠标滚轮：放大/缩小模型</div>
        <div class="tips-item">鼠标悬停在构件：查看构件名称和功能</div>
    </div>

    <div id="tech-hud">`;

if (content.includes(htmlTarget)) {
    content = content.replace(htmlTarget, htmlReplacement);
    console.log('HTML replaced.');
} else {
    console.log('HTML target not found.');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done.');

