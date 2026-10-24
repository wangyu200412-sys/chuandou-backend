import re

filepath = r'D:\backend\app\templates\seismic-principle-new.html'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the particle-fix-panel div
pattern1 = r'<div id="particle-fix-panel".*?</div>'
content = re.sub(pattern1, '', content, flags=re.DOTALL)

# Remove the script block following it that defines showMessage and checkParticleStatus
pattern2 = r'<script>\s*function showMessage\(text\).*?window\.checkParticleStatus = function\(\) \{.*?\};\s*</script>'
content = re.sub(pattern2, '', content, flags=re.DOTALL)

# Remove the dynamic injection of the button
pattern3 = r'const panel = document\.getElementById\(\'particle-fix-panel\'\);.*?buttonsDiv\.appendChild\(newButton\);\s*\}\s*\}'
content = re.sub(pattern3, '', content, flags=re.DOTALL)

# Remove remaining showMessage calls
content = re.sub(r'showMessage\(\'.*?\'\);', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
