const fs = require('fs');

const filepath = 'D:\\backend\\app\\templates\\seismic-principle-new.html';
let content = fs.readFileSync(filepath, 'utf8');

const regex = /function showMessage\(text\) \{[\s\S]*?\} catch \(error\) \{\s*console\.error\('❌ 修复表面函数时出错:', error\);\s*\}\s*\};\s*/;

const replacement = `
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
                
            } catch (error) {
                console.error('❌ 修复表面函数时出错:', error);
            }
        };
`;

content = content.replace(regex, replacement);

fs.writeFileSync(filepath, content, 'utf8');
console.log("Done");
