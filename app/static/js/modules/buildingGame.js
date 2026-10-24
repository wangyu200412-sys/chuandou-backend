/**
 * 穿斗式建筑 - 游戏模块
 */

// 游戏配置
const GameConfig = {
    snapDistance: 0.8,
    animationSpeed: 0.3,
    showHelpOnStart: true
};

// 建筑构件数据
const PartsData = [
    {
        id: 'dijiaofang',
        name: '地脚枋',
        x: 0,
        y: 0.03,
        z: 0,
        w: 2.8,
        h: 0.06,
        d: 0.2,
        order: 1,
        success: {
            quote: '《营造法式》:"地脚枋承柱于地,稳固根基。"',
            source: '——宋《营造法式》',
            exp: '地脚枋将柱子底部连成整体,防止沉降不均,是建筑的根基。'
        },
        error: {
            quote: '《营造法式》:"柱无地脚,则倾覆随之。"',
            source: '——宋',
            exp: '没有地脚枋固定,柱子容易歪斜倒塌,建筑不稳。'
        }
    },
    {
        id: 'zuo_zhu',
        name: '左柱',
        x: -2.25,
        y: 1.2,
        z: 0,
        w: 0.12,
        h: 2.2,
        d: 0.1,
        order: 2,
        success: {
            quote: '《营造法式》:"柱者,建筑之骨也。"',
            source: '——宋《营造法式》',
            exp: '柱子是建筑的支撑骨架,承担全部重量,左右对称受力。'
        },
        error: {
            quote: '《营造法式》:"柱倾则屋覆,此千古不易之理。"',
            source: '——宋',
            exp: '柱子位置错误会导致建筑倾斜甚至倒塌。'
        }
    },
    {
        id: 'you_zhu',
        name: '右柱',
        x: 2.25,
        y: 1.2,
        z: 0,
        w: 0.12,
        h: 2.2,
        d: 0.1,
        order: 2,
        success: {
            quote: '《营造法式》:"柱者,建筑之骨也。"',
            source: '——宋《营造法式》',
            exp: '柱子是建筑的支撑骨架,承担全部重量,左右对称受力。'
        },
        error: {
            quote: '《营造法式》:"柱倾则屋覆,此千古不易之理。"',
            source: '——宋',
            exp: '柱子位置错误会导致建筑倾斜甚至倒塌。'
        }
    },
    {
        id: 'chuanfang_xia',
        name: '穿枋（下）',
        x: 0,
        y: 2.7,
        z: 0,
        w: 2.8,
        h: 0.15,
        d: 0.1,
        order: 3,
        success: {
            quote: '《工程做法》:"穿枋联络各柱,使成一体。"',
            source: '——清《工程做法》',
            exp: '穿枋将柱子连成整体,增强整体性,共同抵抗外力。'
        },
        error: {
            quote: '《工程做法》:"穿枋不联,柱散架倾。"',
            source: '——清',
            exp: '没有穿枋连接,柱子会各自倾斜,结构松散。'
        }
    },
    {
        id: 'chuanfang_toucheng',
        name: '中柱',
        x: 0,
        y: 1.8,
        z: 0,
        w: 0.12,
        h: 2.6,
        d: 0.1,
        order: 4,
        success: {
            quote: '《营造法式》:"穿枋透柱,贯穿整体。"',
            source: '——宋《营造法式》',
            exp: '中柱垂直贯穿整体,增强结构稳定性,防止侧移。'
        },
        error: {
            quote: '《营造法式》:"穿枋不透,结构不稳。"',
            source: '——宋',
            exp: '穿枋未穿透柱会导致结构松散,抗侧能力弱。'
        }
    },
    {
        id: 'zuo_tiaofang',
        name: '左挑枋',
        x: -1.7,
        y: 3.22,
        z: 0,
        w: 1.0,
        h: 0.1,
        d: 0.1,
        order: 5,
        success: {
            quote: '《营造法式》:"挑枋出檐,以蔽风雨。"',
            source: '——宋《营造法式》',
            exp: '挑枋向外伸出,支撑屋檐,保护墙体免受雨淋。'
        },
        error: {
            quote: '《营造法式》:"挑枋不正,檐滴水乱。"',
            source: '——宋',
            exp: '挑枋位置错误会导致屋檐漏水,影响建筑寿命。'
        }
    },
    {
        id: 'you_tiaofang',
        name: '右挑枋',
        x: 1.7,
        y: 3.22,
        z: 0,
        w: 1.0,
        h: 0.1,
        d: 0.1,
        order: 5,
        success: {
            quote: '《营造法式》:"挑枋出檐,以蔽风雨。"',
            source: '——宋《营造法式》',
            exp: '挑枋向外伸出,支撑屋檐,保护墙体免受雨淋。'
        },
        error: {
            quote: '《营造法式》:"挑枋不正,檐滴水乱。"',
            source: '——宋',
            exp: '挑枋位置错误会导致屋檐漏水,影响建筑寿命。'
        }
    },
    {
        id: 'zuo_gua_zhu',
        name: '左瓜柱',
        x: -1.15,
        y: 3.7,
        z: 0,
        w: 0.12,
        h: 0.55,
        d: 0.1,
        order: 6,
        success: {
            quote: '《营造法式》:"瓜柱支梁,分散压力。"',
            source: '——宋《营造法式》',
            exp: '瓜柱将檩条重量传递到穿枋,分散承重压力。'
        },
        error: {
            quote: '《营造法式》:"瓜柱失位,檩无所承。"',
            source: '——宋',
            exp: '瓜柱位置错误会导致檩条塌落,屋顶不稳。'
        }
    },
    {
        id: 'you_gua_zhu',
        name: '右瓜柱',
        x: 1.15,
        y: 3.7,
        z: 0,
        w: 0.12,
        h: 0.55,
        d: 0.1,
        order: 6,
        success: {
            quote: '《营造法式》:"瓜柱支梁,分散压力。"',
            source: '——宋《营造法式》',
            exp: '瓜柱将檩条重量传递到穿枋,分散承重压力。'
        },
        error: {
            quote: '《营造法式》:"瓜柱失位,檩无所承。"',
            source: '——宋',
            exp: '瓜柱位置错误会导致檩条塌落,屋顶不稳。'
        }
    },
    {
        id: 'shang_liang',
        name: '上穿枋',
        x: 0,
        y: 4.2,
        z: 0,
        w: 1.45,
        h: 0.1,
        d: 0.1,
        order: 7,
        success: {
            quote: '《营造法式》:"梁者,架屋之要也。"',
            source: '——宋《营造法式》',
            exp: '梁承托上部重量,传递到柱子,增强整体稳定性。'
        },
        error: {
            quote: '《营造法式》:"梁不正,屋必倾。"',
            source: '——宋',
            exp: '梁位置错误会导致受力不均,影响结构安全。'
        }
    },
    {
        id: 'xia_liang',
        name: '下穿枋',
        x: 0,
        y: 3.7,
        z: 0,
        w: 1.45,
        h: 0.1,
        d: 0.1,
        order: 8,
        success: {
            quote: '《营造法式》:"梁者,架屋之要也。"',
            source: '——宋《营造法式》',
            exp: '梁承托上部重量,传递到柱子,是屋顶结构的关键。'
        },
        error: {
            quote: '《营造法式》:"梁不居中,屋脊必偏。"',
            source: '——宋',
            exp: '梁位置错误会导致屋脊偏移,屋顶不稳。'
        }
    }
];

export class BuildingGame {
    constructor(containerId) {
        this.containerId = containerId;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.raycaster = null;
        this.mouse = null;
        this.draggableObjects = [];
        this.targetZones = [];
        this.placedParts = [];
        this.isDragging = false;
        this.draggedObject = null;
        this.dragOffset = new THREE.Vector3();
        this.dragPlane = new THREE.Plane();
        this.builtGroup = null;
        this.errorCount = {};
        this.isReturningToOriginal = false;
        this.animationId = null;
    }

    init() {
        this.initThreeJS();
        this.createTargetZones();
        this.createDraggableParts();
        this.createUI();
        this.setupEvents();
        this.animate();

        if (GameConfig.showHelpOnStart) {
            setTimeout(() => {
                document.getElementById('gameHelpModal')?.classList.add('show');
            }, 500);
        }

        setTimeout(() => {
            this.showCraftsmanWelcome();
        }, 1000);
    }

    initThreeJS() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0605);
        this.scene.fog = new THREE.Fog(0x0a0605, 10, 50);

        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        this.camera.position.set(0.3, 2.8, 9);
        this.camera.lookAt(0, 1.8, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
        sun.position.set(5, 10, 8);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 2048;
        sun.shadow.mapSize.height = 2048;
        this.scene.add(sun);

        const fill = new THREE.DirectionalLight(0x6688aa, 0.3);
        fill.position.set(-5, 8, -5);
        this.scene.add(fill);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 0.95 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const grid = new THREE.GridHelper(60, 120, 0x3d2314, 0x1a120a);
        this.scene.add(grid);

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
    }

    createTargetZones() {
        PartsData.forEach(part => {
            const zoneGroup = new THREE.Group();
            zoneGroup.position.set(part.x, part.y, part.z);

            const zoneW = part.w * 1.8;
            const zoneH = part.h * 2.5;
            const zoneD = part.d * 2.0;
            const zoneGeo = new THREE.BoxGeometry(zoneW, zoneH, zoneD);
            const zoneMat = new THREE.MeshBasicMaterial({
                color: 0xc9a227,
                transparent: true,
                opacity: 0.12,
                wireframe: true
            });
            const zone = new THREE.Mesh(zoneGeo, zoneMat);

            const edges = new THREE.EdgesGeometry(zoneGeo);
            const line = new THREE.LineSegments(
                edges,
                new THREE.LineBasicMaterial({ color: 0xc9a227, opacity: 0.6, transparent: true })
            );
            zoneGroup.add(line);

            zoneGroup.add(zone);
            zoneGroup.userData = { partId: part.id, isZone: true, zoneMesh: zone };
            this.scene.add(zoneGroup);
            this.targetZones.push(zoneGroup);
        });
    }

    createDraggableParts() {
        const startX = -4.8;
        const positions = [
            { x: startX, y: 0.8, z: 0.8 },
            { x: startX, y: 1.0, z: 0.5 },
            { x: startX, y: 1.1, z: 0.2 },
            { x: startX, y: 1.05, z: -0.1 },
            { x: startX, y: 0.9, z: -0.3 },
            { x: startX, y: 0.95, z: -0.5 },
            { x: startX, y: 1.02, z: -0.7 },
            { x: startX, y: 0.85, z: -0.9 },
            { x: startX, y: 0.98, z: -1.1 },
            { x: startX, y: 1.08, z: -1.3 },
            { x: startX, y: 1.12, z: -1.5 },
            { x: startX, y: 1.15, z: -1.7 }
        ];

        PartsData.forEach((part, index) => {
            let displayW = part.w;
            let displayH = part.h;
            let displayD = part.d;

            if (part.id === 'zuo_zhu' || part.id === 'you_zhu') {
                displayW = part.w * 1.5;
                displayH = part.h * 1.8;
                displayD = part.d * 1.5;
            }

            if (part.id === 'chuanfang_xia' || part.id === 'chuanfang_toucheng' || part.id === 'dijiaofang') {
                displayW = part.w * 1.9;
                displayH = part.h * 2.0;
                displayD = part.d * 1.3;
            }

            if (part.id === 'shang_liang' || part.id === 'xia_liang' || part.id === 'zuo_tiaofang' || part.id === 'you_tiaofang') {
                displayW = part.w * 1.8;
                displayH = part.h * 1.8;
                displayD = part.d * 1.5;
            }

            if (part.id === 'zuo_gua_zhu' || part.id === 'you_gua_zhu') {
                displayW = part.w * 1.8;
                displayH = part.h * 2.4;
                displayD = part.d * 2.5;
            }

            const geo = new THREE.BoxGeometry(displayW, displayH, displayD);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x8b5a2b,
                roughness: 0.6,
                metalness: 0.1
            });

            const mesh = new THREE.Mesh(geo, mat);
            const pos = positions[index % positions.length];
            const minY = displayH / 2 + 0.2;
            mesh.position.set(
                pos.x + (Math.random() - 0.5) * 0.2,
                Math.max(minY, pos.y),
                pos.z + (Math.random() - 0.5) * 0.3
            );

            mesh.castShadow = true;
            mesh.receiveShadow = true;

            mesh.userData = {
                partId: part.id,
                partData: part,
                isDraggable: true,
                originalPos: mesh.position.clone()
            };

            this.scene.add(mesh);
            this.draggableObjects.push(mesh);
        });
    }

    createUI() {
        const container = document.getElementById('gamePartsContainer');
        if (!container) return;
        
        PartsData.forEach(part => {
            const div = document.createElement('div');
            div.className = 'part-item';
            div.id = 'game-ui-' + part.id;
            div.textContent = part.name;
            div.draggable = false;
            container.appendChild(div);
        });

        const totalNum = document.getElementById('gameTotalNum');
        const progressNum = document.getElementById('gameProgressNum');
        if (totalNum) totalNum.textContent = PartsData.length;
        if (progressNum) progressNum.textContent = '0';
    }

    setupEvents() {
        const canvas = this.renderer?.domElement;
        if (!canvas) return;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        window.addEventListener('resize', () => this.onResize());
        
        const restartBtn = document.getElementById('gameRestartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restartGame());
        }
    }

    getMousePos(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
            y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };
    }

    onMouseDown(event) {
        const pos = this.getMousePos(event);
        this.mouse.set(pos.x, pos.y);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.draggableObjects, true);

        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && obj.parent !== this.scene) {
                if (obj.userData.isDraggable) break;
                obj = obj.parent;
            }

            if (obj.userData.isDraggable && !this.placedParts.includes(obj.userData.partId)) {
                this.isDragging = true;
                this.draggedObject = obj;
                obj.userData.originalPos = obj.position.clone();

                this.dragPlane.setFromNormalAndCoplanarPoint(
                    new THREE.Vector3(0, 0, 1),
                    obj.position
                );

                const intersect = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.dragPlane, intersect);
                this.dragOffset.subVectors(obj.position, intersect);

                obj.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.emissive = new THREE.Color(0x333333);
                    }
                });
                
                const uiItem = document.getElementById('game-ui-' + obj.userData.partId);
                if (uiItem) uiItem.classList.add('dragging');
                
                const indicator = document.getElementById('gameDragIndicator');
                if (indicator) indicator.style.display = 'block';
            }
        }
    }

    onMouseMove(event) {
        if (!this.isDragging || !this.draggedObject) return;

        const pos = this.getMousePos(event);
        this.mouse.set(pos.x, pos.y);

        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.dragPlane.setFromNormalAndCoplanarPoint(
            new THREE.Vector3(0, 0, 1),
            this.draggedObject.position.clone()
        );

        const intersect = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, intersect)) {
            this.draggedObject.position.copy(intersect.add(this.dragOffset));
            // 强制将拖拽物件的 Z 轴设为 0
            this.draggedObject.position.z = 0;
        }

        const indicator = document.getElementById('gameDragIndicator');
        if (indicator) {
            indicator.style.left = (event.clientX + 15) + 'px';
            indicator.style.top = (event.clientY - 30) + 'px';
            indicator.textContent = this.draggedObject.userData.partData.name;
        }

        this.checkSnap();
    }

    onMouseUp(event) {
        if (!this.isDragging || !this.draggedObject) return;

        this.draggedObject.traverse((child) => {
            if (child.isMesh && child.material) {
                child.material.emissive = new THREE.Color(0x000000);
            }
        });
        
        const uiItem = document.getElementById('game-ui-' + this.draggedObject.userData.partId);
        if (uiItem) uiItem.classList.remove('dragging');
        
        const indicator = document.getElementById('gameDragIndicator');
        if (indicator) indicator.style.display = 'none';

        const result = this.checkPlacement();

        if (result === 'success') {
            this.placePart();
        } else if (result === 'order_error') {
            this.returnToOriginal(() => {
                this.isDragging = false;
                this.draggedObject = null;
            });
        } else {
            this.showError();
            this.returnToOriginal(() => {
                this.isDragging = false;
                this.draggedObject = null;
            });
        }
    }

    onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchMove(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            const touch = event.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchEnd(event) {
        this.onMouseUp({});
    }

    onResize() {
        const container = document.getElementById(this.containerId);
        if (!container || !this.camera || !this.renderer) return;
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    checkSnap() {
        if (!this.draggedObject || this.isReturningToOriginal) return;

        const partId = this.draggedObject.userData.partId;
        const zone = this.targetZones.find(z => z.userData.partId === partId);

        if (zone) {
            const dx = Math.abs(this.draggedObject.position.x - zone.position.x);
            const dy = Math.abs(this.draggedObject.position.y - zone.position.y);
            const dz = Math.abs(this.draggedObject.position.z - zone.position.z);
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            const zoneMesh = zone.userData.zoneMesh;

            if (dist < GameConfig.snapDistance) {
                this.draggedObject.position.lerp(zone.position, 0.2);
                zoneMesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 0.35;
                        child.material.color.setHex(0x4caf50);
                    }
                });
            } else {
                zoneMesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 0.12;
                        child.material.color.setHex(0xc9a227);
                    }
                });
            }
        }
    }

    showCraftsmanWelcome() {
        const dialog = document.getElementById('gameCraftsmanDialog');
        if (!dialog) return;
        
        dialog.className = 'show guide';
        const message = document.getElementById('gameCraftsmanMessage');
        const tip = document.getElementById('gameCraftsmanTip');
        
        if (message) message.textContent = '小师傅，欢迎来到木工房！我们今天要复原一座穿斗式建筑。这可是咱们老祖宗传下来的好手艺！';
        if (tip) tip.textContent = '🎯 记住哦，建房要按顺序来：先打地基，再立柱子，然后架横梁。顺序乱了可不行！';

        setTimeout(() => {
            dialog.classList.remove('show');
        }, 6000);
    }

    checkPlacement() {
        if (!this.draggedObject) return false;

        const partData = this.draggedObject.userData.partData;
        const zone = this.targetZones.find(z => z.userData.partId === partData.id);

        if (!zone) return false;

        const dx = Math.abs(this.draggedObject.position.x - zone.position.x);
        const dy = Math.abs(this.draggedObject.position.y - zone.position.y);
        const dz = Math.abs(this.draggedObject.position.z - zone.position.z);
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (partData.order) {
            const currentOrder = partData.order;
            const maxPlacedOrder = this.placedParts.length === 0 ? 0 :
                Math.max(...this.placedParts.map(id => {
                    const part = PartsData.find(p => p.id === id);
                    return part ? part.order : 0;
                }));

            if (currentOrder > maxPlacedOrder + 1) {
                this.showOrderError(partData, currentOrder, maxPlacedOrder + 1);
                return 'order_error';
            }
        }

        if (dist < GameConfig.snapDistance) {
            return 'success';
        } else {
            return 'position_error';
        }
    }

    showOrderError(partData, currentOrder, expectedOrder) {
        const orderNames = {
            1: '地脚枋', 2: '左柱/右柱', 3: '穿枋（下）',
            4: '中柱', 5: '左挑枋/右挑枋', 6: '左瓜柱/右瓜柱',
            7: '上穿枋', 8: '下穿枋'
        };

        const dialog = document.getElementById('gameCraftsmanDialog');
        if (!dialog) return;
        
        dialog.className = 'show warning';

        const messages = {
            1: { msg: `哎呀！${partData.name}太重了，得先打地基才行！`, tip: '💡 地脚枋是根基，先把柱子的脚连起来，房子才稳当。' },
            2: { msg: `${partData.name}得等地基打好才能立呢！`, tip: '🪵 柱子是骨架，得先立起来，其他构件才有依靠。' },
            3: { msg: `小师傅，${partData.name}得等柱子立好才能放。`, tip: '🔩 穿枋联络各柱，但得先有柱子才能穿。' },
            4: { msg: `${partData.name}要等下面的穿枋放好才能放呢。`, tip: '⚙️ 中柱要穿过柱子的，得先有柱子。' },
            5: { msg: `小师傅，${partData.name}得等中柱弄好才能放。`, tip: '📐 挑枋出檐，要靠在中柱上。' },
            6: { msg: `${partData.name}要等挑枋放好才能放呢。`, tip: '🏗️ 瓜柱立在穿枋上，挑枋没放好，瓜柱无处立足。' },
            7: { msg: `小师傅，${partData.name}得等瓜柱立好才能放。`, tip: '🔩 梁架在瓜柱上，瓜柱没立好，梁就放不稳。' }
        };

        const msgData = messages[expectedOrder] || { msg: `哎呀，${partData.name}的顺序不对！`, tip: `⚠️ 按老木匠的说法，现在该放${orderNames[expectedOrder]}才对。` };
        
        const messageEl = document.getElementById('gameCraftsmanMessage');
        const tipEl = document.getElementById('gameCraftsmanTip');
        
        if (messageEl) messageEl.textContent = msgData.msg;
        if (tipEl) tipEl.textContent = msgData.tip;

        setTimeout(() => {
            dialog.classList.remove('show');
        }, 5000);
    }

    placePart(obj) {
        const partData = obj.userData.partData;
        const targetPos = new THREE.Vector3(partData.x, partData.y, partData.z);
        const startPos = obj.position.clone();

        this.placedParts.push(partData.id);
        
        const progressNum = document.getElementById('gameProgressNum');
        const progressFill = document.getElementById('gameProgressFill');
        
        if (progressNum) progressNum.textContent = this.placedParts.length;
        if (progressFill) progressFill.style.width = (this.placedParts.length / PartsData.length * 100) + '%';

        const duration = 300;
        const startTime = Date.now();

        const animatePlace = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            obj.position.lerpVectors(startPos, targetPos, eased);

            if (progress < 1) {
                requestAnimationFrame(animatePlace);
            } else {
                this.draggableObjects = this.draggableObjects.filter(o => o !== obj);

                const uiItem = document.getElementById('game-ui-' + partData.id);
                if (uiItem) uiItem.classList.add('placed');

                const zone = this.targetZones.find(z => z.userData.partId === partData.id);
                if (zone) zone.visible = false;

                this.showBook(partData.success, true);

                if (this.placedParts.length === PartsData.length) {
                    setTimeout(() => {
                        this.showCompleteModel();
                        document.getElementById('gameComplete')?.classList.add('show');
                    }, 800);
                }
            }
        };

        animatePlace();
    }

    showError() {
        const partData = this.draggedObject.userData.partData;
        this.errorCount[partData.id] = (this.errorCount[partData.id] || 0) + 1;
        this.showBook(partData.error, false);
    }

    showCompleteModel() {
        this.targetZones.forEach(zone => zone.visible = false);
        this.draggableObjects.forEach(obj => this.scene.remove(obj));
        this.draggableObjects = [];

        document.getElementById('gameComplete')?.classList.add('show');

        this.builtGroup = new THREE.Group();

        PartsData.forEach(part => {
            const geo = new THREE.BoxGeometry(part.w, part.h, part.d);
            const mat = new THREE.MeshStandardMaterial({
                color: 0xa0522d,
                roughness: 0.4,
                metalness: 0.15
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(part.x, part.y, part.z);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            this.builtGroup.add(mesh);
        });

        this.scene.add(this.builtGroup);
        this.animateCameraToView();
    }

    animateCameraToView() {
        const targetPos = { x: 0.3, y: 2.8, z: 6 };
        const startPos = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
        const duration = 1000;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            this.camera.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
            this.camera.position.y = startPos.y + (targetPos.y - startPos.y) * eased;
            this.camera.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
            this.camera.lookAt(0, 1.8, 0);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.startRotation();
            }
        };
        animate();
    }

    startRotation() {
        let angle = 0;
        const rotate = () => {
            if (!this.builtGroup) return;
            angle += 0.006;
            this.camera.position.x = 0.3 + Math.sin(angle) * 6;
            this.camera.position.y = 2.8;
            this.camera.position.z = Math.cos(angle) * 6;
            this.camera.lookAt(0, 1.8, 0);
            this.animationId = requestAnimationFrame(rotate);
        };
        rotate();
    }

    returnToOriginal(callback) {
        this.isReturningToOriginal = true;

        this.targetZones.forEach(zone => {
            const zoneMesh = zone.userData.zoneMesh;
            if (zoneMesh) {
                zoneMesh.traverse((child) => {
                    if (child.isMesh && child.material) {
                        child.material.opacity = 0.12;
                        child.material.color.setHex(0xc9a227);
                    }
                });
            }
        });

        const originalPos = obj.userData.originalPos;
        const startPos = obj.position.clone();
        const duration = 400;
        const startTime = Date.now();

        const animateReturn = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            obj.position.lerpVectors(startPos, originalPos, progress);

            if (progress < 1) {
                requestAnimationFrame(animateReturn);
            } else {
                this.isReturningToOriginal = false;
                if (callback) callback();
            }
        };

        animateReturn();
    }

    showBook(content, isSuccess) {
        const book = document.getElementById('gameBook');
        if (!book) return;
        
        book.className = 'show ' + (isSuccess ? 'success' : 'error');
        
        const title = document.getElementById('gameBookTitle');
        const quote = document.getElementById('gameBookQuote');
        const source = document.getElementById('gameBookSource');
        const exp = document.getElementById('gameBookExp');
        
        if (title) title.textContent = isSuccess ? '✓ 放置正确' : '✗ 放置错误';
        if (quote) quote.textContent = content.quote;
        if (source) source.textContent = content.source;
        if (exp) exp.textContent = content.exp;

        setTimeout(() => {
            book.classList.remove('show');
        }, 3500);
    }

    restartGame() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.placedParts = [];
        this.isDragging = false;
        this.draggedObject = null;
        this.errorCount = {};

        this.draggableObjects.forEach(obj => this.scene.remove(obj));
        this.draggableObjects = [];

        if (this.builtGroup) {
            this.scene.remove(this.builtGroup);
            this.builtGroup = null;
        }

        this.targetZones.forEach(zone => {
            zone.visible = true;
            zone.userData.zoneMesh.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.opacity = 0.12;
                    child.material.color.setHex(0xc9a227);
                }
            });
        });

        document.querySelectorAll('.part-item').forEach(item => {
            item.classList.remove('dragging', 'placed');
        });

        const progressNum = document.getElementById('gameProgressNum');
        const progressFill = document.getElementById('gameProgressFill');
        
        if (progressNum) progressNum.textContent = '0';
        if (progressFill) progressFill.style.width = '0%';
        
        document.getElementById('gameComplete')?.classList.remove('show');
        document.getElementById('gameBook')?.classList.remove('show');

        this.camera.position.set(0.3, 2.8, 9);
        this.camera.lookAt(0, 1.8, 0);

        this.createDraggableParts();
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}
