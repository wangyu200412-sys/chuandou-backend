import io
import re

with io.open('d:\\backend\\app\\templates\\index.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

replacement = '''<div id="growth-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 2000; justify-content: center; align-items: center; backdrop-filter: blur(5px);">
        <div style="background: rgba(20, 25, 30, 0.9); border: 1px solid rgba(196, 165, 116, 0.5); padding: 40px; border-radius: 8px; text-align: center; max-width: 500px; box-shadow: 0 0 30px rgba(0,0,0,0.8);">
            <p style="color: #e6edf3; font-family: 'Noto Serif SC', serif; font-size: 18px; line-height: 1.6; margin-bottom: 30px; letter-spacing: 2px;">
                接下来将动态还原穿斗式建筑的生长过程，感受传统木构的营造逻辑，是否开启：
            </p>
            <div style="display: flex; justify-content: center; gap: 30px;">
                <button id="btn-start-growth" style="background: rgba(196, 165, 116, 0.2); border: 1px solid #c4a574; color: #c4a574; padding: 10px 24px; cursor: pointer; font-family: 'Noto Serif SC', serif; font-size: 16px; border-radius: 4px; transition: all 0.3s; letter-spacing: 1px;" onmouseover="this.style.background='rgba(196, 165, 116, 0.4)'" onmouseout="this.style.background='rgba(196, 165, 116, 0.2)'">【开始生长】</button>
                <button id="btn-cancel-growth" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #ccc; padding: 10px 24px; cursor: pointer; font-family: 'Noto Serif SC', serif; font-size: 16px; border-radius: 4px; transition: all 0.3s; letter-spacing: 1px;" onmouseover="this.style.background='rgba(255,255,255,0.1)'" onmouseout="this.style.background='transparent'">【否】</button>
            </div>
        </div>
    </div>
</body>
</html>'''

content = re.sub(r'<div id="growth-modal".*?</html>', replacement, content, flags=re.DOTALL)

with io.open('d:\\backend\\app\\templates\\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
