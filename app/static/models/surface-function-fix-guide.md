# 表面函数错误修复指南

## 问题描述
在 `seismic-principle-new.html` 文件中出现以下错误：
```
seismic-principle-new.html:7939 增强点投影失败: ReferenceError: center is not defined
    at BuildingForceParticleSystem.projectPointToSurfaceEnhanced (seismic-principle-new.html:7930:51)
    at BuildingForceParticleSystem.applySurfaceConstraintEnhanced (seismic-principle-new.html:8497:37)
    at BuildingForceParticleSystem.update (seismic-principle-new.html:9714:49)
    at updateParticleSystem (seismic-principle-new.html:9987:37)
    at animate (seismic-principle-new.html:5242:17)
```

## 错误原因
在 `projectPointToSurfaceEnhanced` 函数中，`center` 和 `size` 变量在 `else` 块中被引用，但只在 `if` 块内部定义，导致变量作用域问题。

## 已实施的修复方案

### 1. 核心修复（已应用）
已修改 `projectPointToSurfaceEnhanced` 函数，将 `center` 和 `size` 变量的定义移到 `if-else` 块之前，确保在所有代码路径中都可用。

### 2. 自动修复机制
添加了以下修复机制：
- **立即修复脚本**：页面加载后自动检测并修复错误
- **手动修复函数**：`fixSurfaceFunctions()` 函数可手动调用
- **控制台快速命令**：`quickFixCenterError()` 可在控制台中直接运行

### 3. 修复面板增强
在粒子系统修复面板中添加了"表面函数"按钮，一键修复此问题。

## 修复方法

### 方法一：自动修复（推荐）
1. 刷新页面
2. 等待2-3秒，系统会自动检测并修复错误
3. 检查控制台是否有"✅ projectPointToSurfaceEnhanced函数已立即修复"消息

### 方法二：手动修复
1. 打开浏览器控制台 (F12)
2. 输入以下命令之一：
   ```javascript
   // 方法1：使用快速修复命令
   quickFixCenterError()
   
   // 方法2：使用完整修复函数
   fixComplete()
   
   // 方法3：专门修复表面函数
   fixSurfaceFunctions()
   ```

### 方法三：点击修复面板
1. 页面右下角找到"粒子系统修复"面板
2. 点击"表面函数"按钮
3. 等待修复完成

## 验证修复
修复成功后，应该：
1. 控制台不再显示 `center is not defined` 错误
2. 粒子系统正常工作
3. 粒子沿建筑构件表面移动
4. 地震模拟正常运行

## 技术细节
修复的核心是修改 `projectPointToSurfaceEnhanced` 函数中的变量作用域：
```javascript
// 修复前（有问题）：
if (box.containsPoint(point)) {
    const center = new THREE.Vector3();
    box.getCenter(center);
    const size = new THREE.Vector3();
    box.getSize(size);
    // ... 使用 center 和 size
} else {
    // 这里 center 和 size 未定义！
    clampedPoint.x = Math.max(center.x - size.x/2, ...);
}

// 修复后（正确）：
const center = new THREE.Vector3();
box.getCenter(center);
const size = new THREE.Vector3();
box.getSize(size);

if (box.containsPoint(point)) {
    // ... 使用 center 和 size
} else {
    // 这里 center 和 size 已定义
    clampedPoint.x = Math.max(center.x - size.x/2, ...);
}
```

## 故障排除
如果修复后仍有问题：
1. 检查Three.js是否正常加载
2. 检查控制台是否有其他错误
3. 尝试重新初始化粒子系统：
   ```javascript
   if (initParticleSystem) initParticleSystem();
   ```
4. 强制刷新页面 (Ctrl+F5)

## 预防措施
1. 所有变量在使用前必须定义
2. 注意JavaScript的变量作用域规则
3. 在条件块外部定义所有可能用到的变量
4. 添加充分的错误处理机制