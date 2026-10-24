const fs = require('fs');

const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
let content = fs.readFileSync(filepath, 'utf8');

// The broken code we have right now:
const badRegex = /<p id="particle-message"[\s\S]*?console\.error\('❌ 修复表面函数时出错:', error\);\s*\}\s*\};\s*/;

const restoredContent = `
    <div id="particle-fix-panel" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; background: rgba(139, 69, 19, 0.9); padding: 15px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); color: white; font-family: 'Microsoft YaHei', sans-serif; max-width: 300px; display: none;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px;">粒子系统修复</h3>
        <p style="margin: 0 0 15px 0; font-size: 14px; opacity: 0.9;">如果粒子系统有问题，请点击以下按钮：</p>
        <p style="margin: 0 0 15px 0; font-size: 12px; opacity: 0.7; font-style: italic;">提示：粒子只在点击"地震模拟演示"后显示</p>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="fixComplete(); showMessage('正在完整修复...');" 
                    style="background: #8b4513; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">
                完整修复
            </button>
            <button onclick="fixParticleSystem(); showMessage('正在修复粒子系统...');" 
                    style="background: #c93756; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                粒子系统
            </button>
            <button onclick="fixSurfaceConstraints(); showMessage('正在修复表面约束...');" 
                    style="background: #6b8e23; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px;">
                表面约束
            </button>
            <button onclick="demoEarthquake(); showMessage('正在启动地震模拟...');" 
                    style="background: #cc3300; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: bold;">
                🚀 地震模拟
            </button>
        </div>
        <p id="particle-message" style="margin: 10px 0 0 0; font-size: 12px; min-height: 20px;"></p>
        <button onclick="document.getElementById('particle-fix-panel').style.display = 'none';" 
                style="position: absolute; top: 5px; right: 5px; background: none; border: none; color: white; font-size: 18px; cursor: pointer; opacity: 0.7;">×</button>
    </div>
    
    <script>
      
        function showMessage(text) {
            const messageEl = document.getElementById('particle-message');
            if (messageEl) {
                messageEl.textContent = text;
                setTimeout(() => {
                    messageEl.textContent = '';
                }, 3000);
            }
        }
        
    
        setTimeout(() => {
            if (!window.buildingForceSystem || !window.buildingForceSystem.initialized) {
                const panel = document.getElementById('particle-fix-panel');
                if (panel) {
                    panel.style.display = 'block';
                    showMessage('检测到粒子系统可能有问题，请尝试修复');
                }
            }
        }, 3000);
      
        window.checkParticleStatus = function() {
            console.log('=== 粒子系统状态检查 ===');
            console.log('buildingForceSystem:', window.buildingForceSystem ? '存在' : '不存在');
            
            if (window.buildingForceSystem) {
                console.log('是否初始化:', window.buildingForceSystem.initialized);
                console.log('粒子组:', window.buildingForceSystem.particleGroup ? '存在' : '不存在');
                
                if (window.buildingForceSystem.particleGroup) {
                    console.log('粒子组可见:', window.buildingForceSystem.particleGroup.visible);
                    console.log('粒子组在场景中:', !!window.buildingForceSystem.particleGroup.parent);
                    console.log('粒子系统对象:', window.buildingForceSystem.particleSystem ? '存在' : '不存在');
                }
            }
            
            console.log('场景对象:', window.scene ? '存在' : '不存在');
            console.log('=== 检查完成 ===');
            
        
            if (!window.buildingForceSystem || !window.buildingForceSystem.initialized) {
                const panel = document.getElementById('particle-fix-panel');
                if (panel) {
                    panel.style.display = 'block';
                    console.log('已显示修复面板');
                }
            }
        };
        
    
        window.fixSurfaceFunctions = function() {
            console.log('=== 修复表面函数中的变量作用域问题 ===');
            
            if (!window.buildingForceSystem) {
                console.error('❌ buildingForceSystem不存在，无法修复表面函数');
                return;
            }
            
            try {
                
                const originalMethod = window.buildingForceSystem.projectPointToSurfaceEnhanced;
                
                window.buildingForceSystem.projectPointToSurfaceEnhanced = function(point, component) {
                    if (!component || !component.geometry) return point;
                    
                    try {
                        
                        const componentCenter = new THREE.Vector3();
                        component.updateWorldMatrix(true, false);
                        component.getWorldPosition(componentCenter);
                        
                        const direction = componentCenter.clone().sub(point).normalize();
                        
                        this.raycaster.set(point, direction);
                        this.raycaster.far = 100; 
                        const intersects = this.raycaster.intersectObject(component, true);
                        
                        if (intersects.length > 0) {
                            point.copy(intersects[0].point);
                            return point;
                        }
                        
                        const box = new THREE.Box3().setFromObject(component);
                
                        const center = new THREE.Vector3();
                        box.getCenter(center);
                        const size = new THREE.Vector3();
                        box.getSize(size);
                        
                        if (box.containsPoint(point)) {
                            const distToRight = Math.abs(point.x - (center.x + size.x/2));
                            const distToLeft = Math.abs(point.x - (center.x - size.x/2));
                            const distToTop = Math.abs(point.y - (center.y + size.y/2));
                            const distToBottom = Math.abs(point.y - (center.y - size.y/2));
                            const distToFront = Math.abs(point.z - (center.z + size.z/2));
                            const distToBack = Math.abs(point.z - (center.z - size.z/2));
                            
                            const minDist = Math.min(
                                distToRight, distToLeft, distToTop, 
                                distToBottom, distToFront, distToBack
                            );
                            
                            if (minDist === distToRight) {
                                point.x = center.x + size.x/2;
                            } else if (minDist === distToLeft) {
                                point.x = center.x - size.x/2;
                            } else if (minDist === distToTop) {
                                point.y = center.y + size.y/2;
                            } else if (minDist === distToBottom) {
                                point.y = center.y - size.y/2;
                            } else if (minDist === distToFront) {
                                point.z = center.z + size.z/2;
                            } else {
                                point.z = center.z - size.z/2;
                            }
                        } else {
                            const clampedPoint = new THREE.Vector3();
                            clampedPoint.x = Math.max(center.x - size.x/2, Math.min(center.x + size.x/2, point.x));
                            clampedPoint.y = Math.max(center.y - size.y/2, Math.min(center.y + size.y/2, point.y));
                            clampedPoint.z = Math.max(center.z - size.z/2, Math.min(center.z + size.z/2, point.z));
                            point.copy(clampedPoint);
                        }
                        
                        return point;
                        
                    } catch (error) {
                        console.warn('修复后的增强点投影失败:', error);
                        return this.projectPointToSurface(point, component);
                    }
                };
                
                console.log('✅ projectPointToSurfaceEnhanced函数已修复');
            
                const originalApplySurfaceConstraintEnhanced = window.buildingForceSystem.applySurfaceConstraintEnhanced;
                
                window.buildingForceSystem.applySurfaceConstraintEnhanced = function(position, component, isEdgeConstraint = false) {
                    if (!this.surfaceConstraintEnabled || !component) {
                        return position;
                    }
                    
                    try {
                        if (isEdgeConstraint) {
                            return this.projectPointToSurfaceEnhanced(position, component);
                        }
                        
                        const distanceToSurface = this.getDistanceToSurface(position, component);
                        
                        if (distanceToSurface > this.surfaceTolerance) {
                            return this.projectPointToSurfaceEnhanced(position.clone(), component);
                        }
                        
                        const projectedPoint = this.projectPointToSurfaceEnhanced(position.clone(), component);
                        
                        if (position.distanceTo(projectedPoint) < this.surfaceTolerance * 2) {
                            return projectedPoint;
                        }
                        
                        return position;
                        
                    } catch (error) {
                        console.warn('增强表面约束应用失败:', error);
                        return this.applySurfaceConstraint(position, component);
                    }
                };
                
                console.log('✅ applySurfaceConstraintEnhanced函数已增强');
                
                console.log('=== 表面函数修复完成 ===');
                showMessage('表面函数已修复');
                
            } catch (error) {
                console.error('❌ 修复表面函数时出错:', error);
            }
        };
`;

if (badRegex.test(content)) {
    content = content.replace(badRegex, restoredContent);
    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Replaced successfully!");
} else {
    console.log("Could not find the target string!");
}
