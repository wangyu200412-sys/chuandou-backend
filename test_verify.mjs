
        import * as THREE from 'three';
        import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
        import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
        import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
        import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
        import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
        import gsap from 'gsap';
        let scene, camera, renderer, controls, composer;
        let model;
        let columns = [], beams = [], bracketBeams = [], roofs = [], guazhuArray = [];
        let animationTimeline;
        let allLoadedModels = [];  
        let raycaster, mouse;
        let hoveredObject = null;
        let jinfangArray = [];
        let chuanfangArray = []; 
        let linArray = [];  
        const loadedComponentMap = {};

        // 用户指定的全新30步精确生长序列
        const GROWTH_SEQUENCE = [
            // 阶段一 · 坚木立柱
            { id: 'zuozhu_qian',        name: '前檐左柱', stage: '阶段一 · 坚木立柱', stageNum: 1 },
            { id: 'youzhu_qian',        name: '前檐右柱', stage: '阶段一 · 坚木立柱', stageNum: 1 },
            { id: 'zuozhu_hou',         name: '后檐左柱', stage: '阶段一 · 坚木立柱', stageNum: 1 },
            { id: 'youzhu_hou',         name: '后檐右柱', stage: '阶段一 · 坚木立柱', stageNum: 1 },
            { id: 'zhongzhu_qian',      name: '前侧通天中柱', stage: '阶段一 · 坚木立柱', stageNum: 1 },
            { id: 'zhongzhu_hou',       name: '后侧通天中柱', stage: '阶段一 · 坚木立柱', stageNum: 1 },
            // 阶段二 · 穿梁锁架
            { id: 'chuanfang_xia_qian', name: '前檐下穿枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'chuanfang_xia_hou',  name: '后檐下穿枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'chuanfang_zhong_qian', name: '前檐中穿枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'chuanfang_zhong_hou',  name: '后檐中穿枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'chuanfang_shang_qian', name: '前檐上穿枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'chuanfang_shang_hou',  name: '后檐上穿枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'jinfang_zuo',          name: '左侧纵向金枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            { id: 'jinfang_you',          name: '右侧纵向金枋', stage: '阶段二 · 穿梁锁架', stageNum: 2 },
            // 阶段三 · 瓜柱步升
            { id: 'youguazhu_zuo_qian', name: '左前下层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'youguazhu_you_qian', name: '右前下层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'youguazhu_zuo_hou',  name: '左后下层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'youguazhu_you_hou',  name: '右后下层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'zuoguazhu_zuo_qian', name: '左前上层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'zuoguazhu_you_qian', name: '右前上层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'zuoguazhu_zuo_hou',  name: '左后上层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            { id: 'zuoguazhu_you_hou',  name: '右后上层瓜柱', stage: '阶段三 · 瓜柱步升', stageNum: 3 },
            // 阶段四 · 顺坡安檩
            { id: 'jinlin_xia_zuo',     name: '左侧下层金檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            { id: 'jinlin_xia_you',     name: '右侧下层金檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            { id: 'jinlin_shang_zuo',   name: '左侧上层金檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            { id: 'jinlin_shang_you',   name: '右侧上层金檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            { id: 'yanlin_zuo',         name: '左侧外檐檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            { id: 'yanlin_you',         name: '右侧外檐檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            { id: 'jiling',             name: '中央正脊大檩', stage: '阶段四 · 顺坡安檩', stageNum: 4 },
            // 阶段五 · 覆瓦落成
            { id: 'wuding',             name: '传统歇山瓦顶', stage: '阶段五 · 覆瓦落成', stageNum: 5 }
        ];
        let stressChart, chartData = [0], chartStep = 0;
        const scanUniforms = { scanY: { value: -20.0 } };
        const shaderUniforms = { u_scanY: { value: -10.0 } }; 
        const COMPONENT_INFO = {
            'zhongzhu_qian': { category: '立柱系统', name: '前侧通天中柱', description: '位于建筑前侧中央的核心主柱，通天直贯屋脊，是穿斗式建筑中最高的骨架立木。' },
            'zhongzhu_hou': { category: '立柱系统', name: '后侧通天中柱', description: '位于建筑后侧中央的主柱，与前中柱对称并立，共同承托中央大脊檩的垂直总荷载。' },
            'youzhu_qian': { category: '立柱系统', name: '前檐右柱', description: '位于建筑前侧右翼的立柱，确立右开间柱网基准，支撑外檐挑枋与檐口荷载。' },
            'youzhu_hou': { category: '立柱系统', name: '后檐右柱', description: '位于建筑后侧右翼的立柱，与前檐右柱对称排列，稳固后檐右部框架。' },
            'zuozhu_qian': { category: '立柱系统', name: '前檐左柱', description: '位于建筑前侧左翼的立柱，确立左开间柱网基准，与右檐柱共同构成前部对称开间。' },
            'zuozhu_hou': { category: '立柱系统', name: '后檐左柱', description: '位于建筑后侧左翼的立柱，支撑后左房屋骨架，确保整体空间规整。' },
            'chuanfang_xia_qian': { category: '穿枋系统', name: '前檐下穿枋', description: '横向贯穿前檐左柱、中柱与右柱下部，将主柱根基紧锁为平面排架，抗剪抗倾。' },
            'chuanfang_xia_hou': { category: '穿枋系统', name: '后檐下穿枋', description: '横向贯穿后檐左柱、中柱与右柱下部，与前下穿呼应，锁固后部柱底整体。' },
            'chuanfang_zhong_qian': { category: '穿枋系统', name: '前檐中穿枋', description: '横贯前侧排架腰部，穿透中柱与瓜柱柱身，形成坚韧的腰向柔性拉结网络。' },
            'chuanfang_zhong_hou': { category: '穿枋系统', name: '后檐中穿枋', description: '横贯后侧排架腰部，与前中穿枋协同承受水平风荷载与地震剪力。' },
            'chuanfang_shang_qian': { category: '穿枋系统', name: '前檐上穿枋', description: '横向穿过上层瓜柱与中柱高位，使全排架木构在柱顶下方彻底锁死咬合。' },
            'chuanfang_shang_hou': { category: '穿枋系统', name: '后檐上穿枋', description: '位于后部高位的横枋，稳固上部柱架，形成多层叠穿的榫卯刚架。' },
            'jinfang_you': { category: '穿枋系统', name: '右侧纵向金枋', description: '纵向连接前后两榀排架的右翼柱子，将独立的平面排架拉结为空间立体结构。' },
            'jinfang_zuo': { category: '穿枋系统', name: '左侧纵向金枋', description: '纵向连接前后两榀排架的左翼柱子，强化纵向抗侧移刚度。' },
            'youguazhu_you_qian': { category: '瓜柱系统', name: '右前下层瓜柱', description: '立于前右中穿枋之上，短粗如瓜，稳稳支撑右侧下层金檩。' },
            'youguazhu_you_hou': { category: '瓜柱系统', name: '右后下层瓜柱', description: '立于后右中穿枋之上，与前瓜柱对称，托举后坡屋顶骨架。' },
            'youguazhu_zuo_qian': { category: '瓜柱系统', name: '左前下层瓜柱', description: '立于前左中穿枋之上，增加木构支承点，缩短檩条计算跨度。' },
            'youguazhu_zuo_hou': { category: '瓜柱系统', name: '左后下层瓜柱', description: '位于后左承重区域，配合穿枋共同形成多点传力体系。' },
            'zuoguazhu_you_qian': { category: '瓜柱系统', name: '右前上层瓜柱', description: '立于前右上穿枋之上，阶梯向上抬升屋面，直承上层金檩。' },
            'zuoguazhu_you_hou': { category: '瓜柱系统', name: '右后上层瓜柱', description: '位于后侧上层坡架，与前部对称形成平缓举折曲线。' },
            'zuoguazhu_zuo_qian': { category: '瓜柱系统', name: '左前上层瓜柱', description: '立于前左上穿枋之上，分担中央屋脊传递的斜向坡面荷载。' },
            'zuoguazhu_zuo_hou': { category: '瓜柱系统', name: '左后上层瓜柱', description: '后左顶部瓜柱，将重力经穿枋传递至外檐柱与中柱。' },
            'yanlin_you': { category: '檩条系统', name: '右侧外檐檩', description: '架设于右檐挑头之上，向外悬挑以承出檐飞椽，遮风蔽雨。' },
            'yanlin_zuo': { category: '檩条系统', name: '左侧外檐檩', description: '架设于左檐挑头之上，奠定建筑左翼飞檐挑出基准。' },
            'jinlin_xia_you': { category: '檩条系统', name: '右侧下层金檩', description: '横放于右侧下层瓜柱柱顶，承接屋面下坡椽木与瓦片重力。' },
            'jinlin_xia_zuo': { category: '檩条系统', name: '左侧下层金檩', description: '横放于左侧下层瓜柱柱顶，与右金檩共同顺坡承重。' },
            'jinlin_shang_you': { category: '檩条系统', name: '右侧上层金檩', description: '横放于右侧上层瓜柱之巅，形成接近屋脊的二阶坡面支撑。' },
            'jinlin_shang_zuo': { category: '檩条系统', name: '左侧上层金檩', description: '横放于左侧上层瓜柱之巅，与对称金檩形成顺坡阶梯。' },
            'jiling': { category: '檩条系统', name: '中央正脊大檩', description: '端端正正架设于通天中柱最高顶点，为全殿最高之脊梁，上梁大吉！' },
            'wuding': { category: '屋面系统', name: '传统歇山瓦顶', description: '覆盖整座木构骨架的翼角瓦顶，出檐深远，与穿斗排架刚柔相济，立千年而不倾。' }
        };
        const COMPONENT_CONFIGS = {
            columns: [
                { file: 'zhongzhu_qian.glb', name: 'zhongzhu_qian' },
                { file: 'zhongzhu_hou.glb', name: 'zhongzhu_hou' },
                { file: 'youzhu_qian.glb', name: 'youzhu_qian' },
                { file: 'youzhu_hou.glb', name: 'youzhu_hou' },
                { file: 'zuozhu_qian.glb', name: 'zuozhu_qian' },
                { file: 'zuozhu_hou.glb', name: 'zuozhu_hou' }
            ],
            chuanfang: [
                { file: 'chuanfang_xia_qian.glb', name: 'chuanfang_xia_qian' },
                { file: 'chuanfang_xia_hou.glb', name: 'chuanfang_xia_hou' },
                { file: 'chuanfang_zhong_qian.glb', name: 'chuanfang_zhong_qian' },
                { file: 'chuanfang_zhong_hou.glb', name: 'chuanfang_zhong_hou' },
                { file: 'chuanfang_shang_qian.glb', name: 'chuanfang_shang_qian' },
                { file: 'chuanfang_shang_hou.glb', name: 'chuanfang_shang_hou' }
            ],
            jinfang: [
                { file: 'jinfang_you.glb', name: 'jinfang_you' },
                { file: 'jinfang_zuo.glb', name: 'jinfang_zuo' }
            ],
            jinlin: [
                { file: 'jinlin_shang_you.glb', name: 'jinlin_shang_you' },
                { file: 'jinlin_shang_zuo.glb', name: 'jinlin_shang_zuo' },
                { file: 'jinlin_xia_you.glb', name: 'jinlin_xia_you' },
                { file: 'jinlin_xia_zuo.glb', name: 'jinlin_xia_zuo' }
            ],
            yanlin: [
                { file: 'yanlin_you.glb', name: 'yanlin_you' },
                { file: 'yanlin_zuo.glb', name: 'yanlin_zuo' }
            ],
            jiling: [
                { file: 'jiling.glb', name: 'jiling' }
            ],
            guazhu: [
                { file: 'youguazhu_you_qian.glb', name: 'youguazhu_you_qian' },
                { file: 'youguazhu_you_hou.glb', name: 'youguazhu_you_hou' },
                { file: 'youguazhu_zuo_qian.glb', name: 'youguazhu_zuo_qian' },
                { file: 'youguazhu_zuo_hou.glb', name: 'youguazhu_zuo_hou' },
                { file: 'zuoguazhu_you_qian.glb', name: 'zuoguazhu_you_qian' },
                { file: 'zuoguazhu_you_hou.glb', name: 'zuoguazhu_you_hou' },
                { file: 'zuoguazhu_zuo_qian.glb', name: 'zuoguazhu_zuo_qian' },
                { file: 'zuoguazhu_zuo_hou.glb', name: 'zuoguazhu_zuo_hou' }
            ],
            roofs: [
                { file: 'wuding.glb', name: 'wuding', position: { x: 0, y: 0.05, z: 0 } }
            ]
        };
        const CONFIG = {
            skyHeight: 100,
            columnDropDuration: 0.8,
            beamSlideDuration: 0.6,
            bracketExtendDuration: 0.7,
            emissiveIntensity: 0.5,
            emissiveDuration: 0.3,
            cameraPullBackDistance: 50,
            cameraPullBackDuration: 4,
            guazhuWaitReduction: 3.5,
            roofWaitReduction: 11
        };
        function initScene() {
            scene = new THREE.Scene();
            scene.background = null;  
            scene.fog = new THREE.Fog(0x121212, 20, 120); 
            camera = new THREE.PerspectiveCamera(
                45,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            camera.position.set(15, 8, 20);
            camera.lookAt(0, 5, 0);
            renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                alpha: true 
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;
            renderer.setClearColor(0x000000, 0);  
            
            document.getElementById('canvas-container').appendChild(renderer.domElement);
            controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.maxPolarAngle = Math.PI / 2 + 0.3;
            controls.minDistance = 5;
            controls.maxDistance = 100;
            
            // 阻止滚轮向上传播，确保 Three.js OrbitControls 专属处理 3D 模型缩放
            renderer.domElement.addEventListener('wheel', (e) => {
                e.stopPropagation();
            }, { passive: false });
            composer = new EffectComposer(renderer);
            const renderPass = new RenderPass(scene, camera);
            composer.addPass(renderPass);
            const bloomPass = new UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.2, 0.5, 0.2
            );
            composer.addPass(bloomPass);
            setupLights();
            raycaster = new THREE.Raycaster();
            mouse = new THREE.Vector2();
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('click', onMouseClick);
            window.addEventListener('resize', onWindowResize);
        }
        function onMouseMove(event) {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }
        function onMouseClick(event) {
            checkHover();
        }
        function onWindowResize() {
            if (!camera || !renderer) return;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (composer) {
                composer.setSize(window.innerWidth, window.innerHeight);
            }
        }
        function checkHover() {
            if (!raycaster || !mouse) return;
            const allComponents = Object.values(loadedComponentMap).length > 0 ? Object.values(loadedComponentMap) : [...columns, ...beams, ...guazhuArray, ...roofs];
            if (allComponents.length === 0) return;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(allComponents, true);
            const infoPanel = document.getElementById('info-panel');
            const infoCategory = document.getElementById('info-category');
            const infoTitle = document.getElementById('info-title');
            const infoDescription = document.getElementById('info-description');
            
            if (intersects.length > 0) {
                let target = intersects[0].object;
                while (target && !target.userData.componentName) {
                    target = target.parent;
                }
                
                if (target && target.userData.componentName) {
                    const componentName = target.userData.componentName;
                    const info = COMPONENT_INFO[componentName];
                    
                    if (info) {
                        infoPanel.classList.add('visible');
                        infoCategory.textContent = '构件分类：' + info.category;
                        infoTitle.textContent = info.name;
                        infoDescription.textContent = info.description;
                    }
                    setHoveredBadge(componentName);
                }
            } else {
                infoPanel.classList.remove('visible');
                setHoveredBadge(null);
            }
        }
        function setupLights() {
            const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.4);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffeedd, 1.5);
            directionalLight.position.set(20, 30, 20);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 100;
            directionalLight.shadow.camera.left = -30;
            directionalLight.shadow.camera.right = 30;
            directionalLight.shadow.camera.top = 30;
            directionalLight.shadow.camera.bottom = -30;
            directionalLight.shadow.bias = -0.0001;
            scene.add(directionalLight);
            const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
            fillLight.position.set(-10, 10, -10);
            scene.add(fillLight);
            const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
            scene.add(hemisphereLight);
        }
        function loadModel() {
            return new Promise((resolve, reject) => {
                const loader = new GLTFLoader();
                let loadedCount = 0;
                let failedCount = 0;

                const tasks = [];
                Object.keys(COMPONENT_CONFIGS).forEach(categoryKey => {
                    COMPONENT_CONFIGS[categoryKey].forEach(component => {
                        tasks.push({ categoryKey, component });
                    });
                });

                const totalCount = tasks.length;
                console.log(`开始高速并发加载 ${totalCount} 个 GLB 构件文件...`);
                const loadingEl = document.getElementById('loading');

                if (totalCount === 0) {
                    if (loadingEl) loadingEl.classList.add('hidden');
                    resolve();
                    return;
                }

                function processLoadedModel(gltf, component, categoryKey) {
                    const loadedModel = gltf.scene;
                    loadedModel.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            if (!child.material || child.material.color === undefined || child.material.color.getHex() === 0) {
                                const woodMaterial = new THREE.MeshStandardMaterial({
                                    color: 0x8B4513,  
                                    roughness: 0.8,
                                    metalness: 0.1,
                                    transparent: true,
                                    opacity: 0
                                });
                                child.material = woodMaterial;
                            } else {
                                child.material.transparent = true;
                                child.material.opacity = 0;
                            }
                            child.material.onBeforeCompile = (shader) => {
                                shader.uniforms.u_scanY = shaderUniforms.u_scanY;
                                
                                shader.vertexShader = shader.vertexShader.replace(
                                    '#include <common>',
                                    `#include <common>\n varying float vWorldY;`
                                );
                                shader.vertexShader = shader.vertexShader.replace(
                                    '#include <worldpos_vertex>',
                                    `#include <worldpos_vertex>\n vWorldY = worldPosition.y;`
                                );
                                
                                shader.fragmentShader = shader.fragmentShader.replace(
                                    '#include <common>',
                                    `#include <common>\n uniform float u_scanY;\n varying float vWorldY;`
                                );
                                shader.fragmentShader = shader.fragmentShader.replace(
                                    '#include <dithering_fragment>',
                                    `#include <dithering_fragment>
                                    vec3 heatColor = vec3(0.0);
                                    if (vWorldY < 3.0) {
                                        heatColor = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.8, 0.0), clamp(vWorldY / 3.0, 0.0, 1.0));
                                    } else if (vWorldY < 6.0) {
                                        heatColor = mix(vec3(1.0, 0.8, 0.0), vec3(0.0, 1.0, 0.0), clamp((vWorldY - 3.0) / 3.0, 0.0, 1.0));
                                    } else {
                                        heatColor = mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0), clamp((vWorldY - 6.0) / 4.0, 0.0, 1.0));
                                    }
                                    float dist = abs(vWorldY - u_scanY);
                                    float scanBand = 1.0 - smoothstep(0.0, 1.0, dist);
                                    if (scanBand > 0.0) {
                                        gl_FragColor.rgb = mix(gl_FragColor.rgb, heatColor * 2.0, scanBand * 0.85);
                                    }`
                                );
                            };
                            child.userData.originalPosition = child.position.clone();
                            child.userData.originalRotation = child.rotation.clone();
                            child.userData.componentName = component.name;
                            child.userData.category = categoryKey;
                            loadedComponentMap[component.name] = child;
                            registerComponentBadge(child, component.name, categoryKey);
                            switch(categoryKey) {
                                case 'columns':
                                    setupComponentAsSky(child);
                                    columns.push(child);
                                    break;
                                case 'chuanfang':
                                    setupComponentAsSky(child);
                                    child.rotation.y = 0;
                                    child.userData.originalRotation.y = 0;
                                    child.userData.slideStartPosition = new THREE.Vector3(
                                        child.position.x + (child.position.x > 0 ? 15 : -15),
                                        child.position.y,
                                        child.position.z
                                    );
                                    chuanfangArray.push(child);
                                    beams.push(child);
                                    break;
                                case 'jinfang':
                                    setupComponentAsSky(child);
                                    child.rotation.y = 0;
                                    child.userData.originalRotation.y = 0;
                                    child.userData.slideStartPosition = new THREE.Vector3(
                                        child.position.x,
                                        child.position.y,
                                        child.position.z + (child.position.z > 0 ? 15 : -15)
                                    );
                                    jinfangArray.push(child);
                                    beams.push(child);
                                    break;
                                case 'guazhu':
                                    setupComponentAsSky(child);
                                    guazhuArray.push(child);
                                    break;
                                case 'jinlin':
                                case 'yanlin':
                                case 'jiling':
                                    setupComponentAsSky(child);
                                    child.rotation.y = 0;
                                    child.userData.originalRotation.y = 0;
                                    child.userData.slideStartPosition = new THREE.Vector3(
                                        child.position.x,
                                        child.position.y + 12,
                                        child.position.z
                                    );
                                    linArray.push(child);
                                    break;
                                case 'roofs':
                                    if (child.material) {
                                        child.material.transparent = true;
                                        child.material.opacity = 0;
                                        child.material.depthWrite = false;
                                    }
                                    if (component.position) {
                                        child.userData.originalPosition = new THREE.Vector3(
                                            component.position.x,
                                            component.position.y,
                                            component.position.z
                                        );
                                        child.position.copy(child.userData.originalPosition);
                                    }
                                    if (child.userData.originalPosition) {
                                        child.position.copy(child.userData.originalPosition);
                                        child.position.y += CONFIG.skyHeight;
                                    }
                                    roofs.push(child);
                                    break;
                            }
                        }
                    });
                    scene.add(loadedModel);
                    allLoadedModels.push({ model: loadedModel, config: component });
                }

                function onSingleComplete() {
                    loadedCount++;
                    if (loadingEl) {
                        loadingEl.textContent = `建筑生长中... ${loadedCount}/${totalCount}`;
                    }

                    if (loadedCount + failedCount >= totalCount) {
                        console.log(`构件模型并发加载完成！成功: ${loadedCount}, 失败: ${failedCount}`);
                        if (loadingEl) loadingEl.classList.add('hidden');
                        resolve();
                    }
                }

                const CONCURRENCY = 6;
                let currentIndex = 0;

                function loadNext() {
                    if (currentIndex >= tasks.length) return;
                    const { categoryKey, component } = tasks[currentIndex++];
                    const filePath = '/static/models/' + component.file;

                    const timeoutId = setTimeout(() => {
                        console.warn(`加载超时: ${filePath}，跳过继续`);
                        failedCount++;
                        onSingleComplete();
                        loadNext();
                    }, 8000);

                    loader.load(
                        filePath,
                        (gltf) => {
                            clearTimeout(timeoutId);
                            try {
                                processLoadedModel(gltf, component, categoryKey);
                            } catch (err) {
                                console.error(`构件解析异常: ${filePath}`, err);
                            }
                            onSingleComplete();
                            loadNext();
                        },
                        undefined,
                        (error) => {
                            clearTimeout(timeoutId);
                            console.error(`加载失败: ${filePath}`, error);
                            failedCount++;
                            onSingleComplete();
                            loadNext();
                        }
                    );
                }

                for (let i = 0; i < Math.min(CONCURRENCY, tasks.length); i++) {
                    loadNext();
                }
            });
        }
        function setupComponentAsSky(mesh) {
            if (mesh.material) {
                mesh.material.transparent = true;
                mesh.material.opacity = 0;
                mesh.material.depthWrite = false;
            }
            if (!mesh.userData.originalScale) {
                mesh.userData.originalScale = mesh.scale.clone();
            }
            mesh.position.y = mesh.userData.originalPosition.y - 15;
            mesh.scale.set(mesh.userData.originalScale.x * 0.01, mesh.userData.originalScale.y * 0.01, mesh.userData.originalScale.z * 0.01);
            mesh.rotation.y += (Math.random() - 0.5) * Math.PI * 0.5;
        }
        function createDemoModel() {
            model = new THREE.Group();
            const woodMaterial = new THREE.MeshStandardMaterial({
                color: 0x8B4513,
                roughness: 0.8,
                metalness: 0.1,
                transparent: true,
                opacity: 0
            });
            for (let i = 0; i < 4; i++) {
                const colGeometry = new THREE.CylinderGeometry(0.3, 0.35, 8, 16);
                const column = new THREE.Mesh(colGeometry, woodMaterial.clone());
                column.name = `Col_${i}`;
                column.position.set(i * 4 - 6, 4, 0);
                column.userData.originalPosition = column.position.clone();
                column.userData.originalRotation = column.rotation.clone();
                column.castShadow = true;
                column.receiveShadow = true;
                model.add(column);
                columns.push(column);
            }
            for (let i = 0; i < 3; i++) {
                const beamGeometry = new THREE.BoxGeometry(3.5, 0.4, 0.4);
                const beam = new THREE.Mesh(beamGeometry, woodMaterial.clone());
                beam.name = `Fang_${i}`;
                beam.position.set(i * 4 - 4.5, 7.5, 0);
                beam.userData.originalPosition = beam.position.clone();
                beam.userData.originalRotation = beam.rotation.clone();
                beam.castShadow = true;
                beam.receiveShadow = true;
                beam.userData.slideStartPosition = new THREE.Vector3(
                    beam.position.x + (Math.random() > 0.5 ? 10 : -10),
                    beam.position.y,
                    beam.position.z
                );
                
                model.add(beam);
                beams.push(beam);
            }
            for (let i = 0; i < 4; i++) {
                const side = i % 2 === 0 ? 1 : -1;
                const bracketGeometry = new THREE.BoxGeometry(2, 0.3, 0.3);
                const bracket = new THREE.Mesh(bracketGeometry, woodMaterial.clone());
                bracket.name = `Tiao_${i}`;
                const xPos = i < 2 ? -6 : 6;
                bracket.position.set(xPos, 6, side * 2);
                bracket.userData.originalPosition = bracket.position.clone();
                bracket.userData.originalRotation = bracket.rotation.clone();
                bracket.userData.extendStartPosition = new THREE.Vector3(
                    xPos,
                    6,
                    0
                );
                bracket.castShadow = true;
                bracket.receiveShadow = true;
                model.add(bracket);
                bracketBeams.push(bracket);
            }

            scene.add(model);
            document.getElementById('loading').classList.add('hidden');
        }
        function initHUD() {
            const categories = {
                'columns': 'cat-columns',
                'guazhu': 'cat-guazhu',
                'jinlin': 'cat-purlins',
                'yanlin': 'cat-purlins',
                'jiling': 'cat-purlins',
                'tiaofang': 'cat-tiaofang',
                'chuanfang': 'cat-chuanfang',
                'jinfang': 'cat-chuanfang'
            };

            for (const [catKey, catList] of Object.entries(COMPONENT_CONFIGS)) {
                const targetId = categories[catKey];
                if (!targetId) continue;
                
                const container = document.getElementById(targetId);
                if (!container) continue;

                catList.forEach(comp => {
                    const div = document.createElement('div');
                    div.className = 'hud-item';
                    div.id = 'hud-' + comp.name;
                    
                    let chineseName = comp.name;
                    if (COMPONENT_INFO[comp.name]) {
                        chineseName = COMPONENT_INFO[comp.name].name;
                    } else {
                        chineseName = comp.name.replace('.glb', '');
                    }
                    
                    div.textContent = chineseName;
                    container.appendChild(div);
                });
            }
        }
        function initECharts() {
            const chartDom = document.getElementById('echarts-mini-chart');
            if (!chartDom || typeof echarts === 'undefined') return;
            stressChart = echarts.init(chartDom);
            stressChart.setOption({
                title: { text: '抗震刚度增长曲线', textStyle: { color: '#A68B5B', fontSize: 12, fontFamily: 'Noto Serif SC', fontWeight: 'normal' } },
                grid: { left: '2%', right: '5%', top: '30%', bottom: '5%', containLabel: true },
                xAxis: { type: 'category', show: false, boundaryGap: false },
                yAxis: { type: 'value', show: false, splitLine: { show: false } },
                series: [{
                    type: 'line',
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { color: '#A68B5B', width: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(166, 139, 91, 0.5)' },
                            { offset: 1, color: 'rgba(166, 139, 91, 0)' }
                        ])
                    },
                    data: chartData
                }]
            });
        }

        function updateHUD(componentName, status, stageText, counterText) {
            let chineseName = componentName;
            let desc = '';
            let category = '构件';
            
            if (COMPONENT_INFO[componentName]) {
                const info = COMPONENT_INFO[componentName];
                chineseName = info.name;
                desc = info.description;
                category = info.category || '构件';
            } else {
                chineseName = componentName.replace('.glb', '');
            }

            const stageBadge = document.getElementById('hud-stage-badge');
            const compNameEl = document.getElementById('hud-title');
            const compDescEl = document.getElementById('hud-desc');
            const catTagEl = document.getElementById('hud-category-tag');
            const counterEl = document.getElementById('hud-counter');
            const progressFill = document.getElementById('hud-progress-fill');

            if (stageText && stageBadge) {
                stageBadge.textContent = stageText;
            }
            if (counterText && counterEl) {
                counterEl.textContent = counterText;
            }
            if (catTagEl) {
                catTagEl.textContent = `【${category}】`;
            }
            if (compNameEl) {
                compNameEl.textContent = (status === 'GROWING' ? '正在生长：' : '已就位：') + chineseName;
            }
            if (compDescEl && desc) {
                compDescEl.textContent = desc;
            }

            if (progressFill && counterText) {
                const match = counterText.match(/(\d+)\s*\/\s*(\d+)/);
                if (match) {
                    const current = parseInt(match[1]);
                    const total = parseInt(match[2]);
                    progressFill.style.width = ((current / total) * 100) + '%';
                }
            }

            if (status === 'LOCKED' && stressChart) {
                chartStep++;
                const newVal = chartData[chartData.length - 1] + Math.pow(chartStep, 1.35) * 0.18;
                chartData.push(newVal);
                stressChart.setOption({
                    series: [{ data: chartData }]
                });
            }
        }


        let tagDisplayMode = 'active'; // 仅显示当前正在生长的构件
        const componentBadges = new Map();
        const tempVec = new THREE.Vector3();
        let hoveredBadgeName = null;

        function registerComponentBadge(mesh, componentName, categoryKey) {
            try {
                if (!componentName || componentBadges.has(componentName)) return;
                const container = document.getElementById('labels-container');
                if (!container) return;

                let chineseName = componentName;
                if (COMPONENT_INFO[componentName]) {
                    chineseName = COMPONENT_INFO[componentName].name;
                }

                const badgeEl = document.createElement('div');
                badgeEl.className = 'comp-badge';
                badgeEl.id = 'badge-' + componentName;

                const dot = document.createElement('span');
                dot.className = 'badge-dot';
                const text = document.createElement('span');
                text.className = 'badge-text';
                text.textContent = chineseName;

                badgeEl.appendChild(dot);
                badgeEl.appendChild(text);
                container.appendChild(badgeEl);

                let localAnchor = new THREE.Vector3(0, 0, 0);
                if (mesh && mesh.geometry) {
                    try {
                        if (!mesh.geometry.boundingBox) {
                            mesh.geometry.computeBoundingBox();
                        }
                        const b = mesh.geometry.boundingBox;
                        if (b && isFinite(b.max.y) && isFinite(b.min.y)) {
                            let anchorY = b.max.y;
                            if (categoryKey === 'columns') {
                                anchorY = b.min.y + (b.max.y - b.min.y) * 0.72;
                            }
                            localAnchor.set((b.min.x + b.max.x) / 2, anchorY, (b.min.z + b.max.z) / 2);
                        }
                    } catch (geoErr) {
                        console.warn('计算构件包围盒异常，使用默认锚点:', componentName, geoErr);
                    }
                }

                componentBadges.set(componentName, {
                    element: badgeEl,
                    textEl: text,
                    mesh: mesh,
                    localAnchor: localAnchor,
                    category: categoryKey,
                    name: chineseName,
                    status: 'hidden',
                    visible: false
                });
            } catch (err) {
                console.error('注册构件标签异常:', componentName, err);
            }
        }

        function setHoveredBadge(name) {
            if (hoveredBadgeName === name) return;
            if (hoveredBadgeName && componentBadges.has(hoveredBadgeName)) {
                const prev = componentBadges.get(hoveredBadgeName);
                prev.element.classList.remove('badge-hovered');
            }
            hoveredBadgeName = name;
            if (hoveredBadgeName && componentBadges.has(hoveredBadgeName)) {
                const curr = componentBadges.get(hoveredBadgeName);
                curr.element.classList.add('badge-hovered');
            }
        }

        function updateBadgeStatus(compName, status) {
            if (!componentBadges.has(compName)) return;
            const badge = componentBadges.get(compName);
            badge.status = status;
            badge.element.classList.remove('badge-growing', 'badge-locked', 'badge-hovered');

            if (status === 'growing') {
                // 仅显示当前生长的构件的名称，隐藏其它构件
                componentBadges.forEach((b, name) => {
                    if (name !== compName) {
                        b.visible = false;
                        b.status = 'hidden';
                        b.element.style.display = 'none';
                    }
                });
                badge.visible = true;
                badge.element.classList.add('badge-growing');
                badge.textEl.textContent = badge.name;
            } else if (status === 'locked') {
                // 已经生长的构件的名称不再显示
                badge.visible = false;
                badge.element.style.display = 'none';
            } else if (status === 'hidden') {
                badge.visible = false;
                badge.element.style.display = 'none';
            }
        }

        function updateAllBadges() {
            if (!componentBadges || componentBadges.size === 0) return;
            const width = window.innerWidth;
            const height = window.innerHeight;
            const halfW = width / 2;
            const halfH = height / 2;

            componentBadges.forEach((badge, compName) => {
                try {
                    const isHovered = (hoveredBadgeName === compName);
                    // 仅当前生长的构件或鼠标悬停的构件显示
                    const shouldShow = (badge.status === 'growing' && badge.visible) || isHovered;

                    if (!shouldShow) {
                        if (badge.element.style.display !== 'none') badge.element.style.display = 'none';
                        return;
                    }

                    if (!badge.mesh || !badge.mesh.matrixWorld) return;

                    tempVec.copy(badge.localAnchor).applyMatrix4(badge.mesh.matrixWorld);
                    tempVec.y += (badge.category === 'roofs' ? 0.9 : 0.25);
                    tempVec.project(camera);

                    if (tempVec.z > 1.0 || tempVec.x < -1.15 || tempVec.x > 1.15 || tempVec.y < -1.15 || tempVec.y > 1.15) {
                        if (badge.element.style.display !== 'none') badge.element.style.display = 'none';
                        return;
                    }

                    const screenX = tempVec.x * halfW + halfW;
                    const screenY = -tempVec.y * halfH + halfH;

                    if (badge.element.style.display !== 'inline-flex') {
                        badge.element.style.display = 'inline-flex';
                    }
                    badge.element.style.transform = `translate(-50%, -100%) translate3d(${screenX}px, ${screenY}px, 0)`;
                } catch (e) {
                    // 容错单个构件
                }
            });
        }

        function playGrowthAnimation() {
            if (animationTimeline) {
                animationTimeline.kill();
            }
            animationTimeline = gsap.timeline({ timeScale: 1.0 });

            // 提速流畅节奏：每个构件约 1.1 秒（0.8s位移就位咬合，0.3s定格光效与标签展开）
            const COMP_INTERVAL = 1.1;
            const COMP_DURATION = 0.8;

            let currentTime = 0.0;
            let currentStageNum = 1;

            // 按照用户指定的严格顺序依次进行生长装配
            GROWTH_SEQUENCE.forEach((item, index) => {
                const compMesh = loadedComponentMap[item.id];
                if (!compMesh) return;

                // 若进入下一结构阶段，插入小幅停顿与平滑运镜
                if (item.stageNum !== currentStageNum) {
                    currentTime += 0.5;
                    currentStageNum = item.stageNum;

                    if (currentStageNum === 2) {
                        // 阶段二 · 穿梁锁架：侧前透视展示穿斗榫卯
                        animationTimeline.to(camera.position, {
                            x: 16, y: 7.0, z: 20,
                            duration: 0.9,
                            ease: "power2.inOut",
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                        animationTimeline.to(controls.target, {
                            y: 4.0,
                            duration: 0.9,
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                    } else if (currentStageNum === 3) {
                        // 阶段三 · 瓜柱步升：视角微仰展示步步递升
                        animationTimeline.to(camera.position, {
                            x: 18, y: 8.0, z: 22,
                            duration: 0.9,
                            ease: "power2.inOut",
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                        animationTimeline.to(controls.target, {
                            y: 4.5,
                            duration: 0.9,
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                    } else if (currentStageNum === 4) {
                        // 阶段四 · 顺坡安檩：镜头抬升展现举折坡架
                        animationTimeline.to(camera.position, {
                            x: 18, y: 10.0, z: 22,
                            duration: 0.9,
                            ease: "power2.inOut",
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                        animationTimeline.to(controls.target, {
                            y: 5.5,
                            duration: 0.9,
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                    } else if (currentStageNum === 5) {
                        // 阶段五 · 覆瓦落成：拉升远景俯瞰全殿歇山大顶
                        animationTimeline.to(camera.position, {
                            x: 20, y: 13.0, z: 24,
                            duration: 1.1,
                            ease: "power2.inOut",
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                        animationTimeline.to(controls.target, {
                            y: 5.5,
                            duration: 1.1,
                            onUpdate: () => controls.update()
                        }, currentTime - 0.5);
                    }
                }

                const startTime = currentTime;
                const origScale = compMesh.userData.originalScale || compMesh.scale;
                const compNum = index + 1;
                const isRoof = (item.id === 'wuding');
                const animDuration = isRoof ? 1.3 : COMP_DURATION;

                // 启动发光、更新HUD状态与标签
                animationTimeline.call(() => {
                    updateHUD(item.id, 'GROWING', item.stage, `构件 ${compNum} / ${GROWTH_SEQUENCE.length}`);
                    updateBadgeStatus(item.id, 'growing');
                    if (compMesh.material) {
                        compMesh.material.opacity = 1;
                        compMesh.material.emissive.setHex(0xD4B984);
                        compMesh.material.emissiveIntensity = isRoof ? 0.45 : 0.55;
                    }
                }, null, startTime);

                // 位置复原入位
                animationTimeline.to(compMesh.position, {
                    x: compMesh.userData.originalPosition.x,
                    y: compMesh.userData.originalPosition.y,
                    z: compMesh.userData.originalPosition.z,
                    duration: animDuration,
                    ease: "power2.out",
                    onComplete: () => {
                        if (compMesh.material) {
                            compMesh.material.wireframe = false;
                            compMesh.material.color.setHex(0x8B4513);
                            compMesh.material.needsUpdate = true;
                            updateHUD(item.id, 'LOCKED', item.stage, `构件 ${compNum} / ${GROWTH_SEQUENCE.length}`);
                            updateBadgeStatus(item.id, 'locked');
                            gsap.to(compMesh.material, {
                                emissiveIntensity: 0,
                                duration: isRoof ? 0.6 : 0.35,
                                ease: "power1.out"
                            });
                        }
                    }
                }, startTime);

                // 缩放复原
                animationTimeline.to(compMesh.scale, {
                    x: origScale.x,
                    y: origScale.y,
                    z: origScale.z,
                    duration: animDuration * (isRoof ? 0.9 : 0.75),
                    ease: "power2.out"
                }, startTime);

                // 旋转复原
                if (compMesh.userData.originalRotation) {
                    animationTimeline.to(compMesh.rotation, {
                        x: compMesh.userData.originalRotation.x,
                        y: compMesh.userData.originalRotation.y,
                        z: compMesh.userData.originalRotation.z,
                        duration: animDuration * 0.75,
                        ease: "power2.out"
                    }, startTime);
                }

                currentTime += isRoof ? 1.6 : COMP_INTERVAL;
            });

            // 营造终章：运镜漫游、全殿光晕、应力波扫描
            animationTimeline.to(camera.position, {
                x: 22, y: 8, z: 20,
                duration: 1.8,
                ease: "power2.inOut",
                onUpdate: () => controls.update()
            }, currentTime);

            animationTimeline.to(controls.target, {
                y: 4.5,
                duration: 1.8,
                onUpdate: () => controls.update()
            }, currentTime);

            animationTimeline.fromTo(shaderUniforms.u_scanY, 
                { value: -5.0 },
                { 
                    value: 15.0, 
                    duration: 1.8, 
                    ease: "power1.inOut"
                }, 
                currentTime + 0.3
            );

            animationTimeline.call(() => {
                triggerGlobalGlow();
                const stageBadge = document.getElementById('hud-stage-badge');
                if (stageBadge) stageBadge.textContent = "营造圆满落成 ✨";
                const titleEl = document.getElementById('hud-title');
                if (titleEl) titleEl.textContent = "穿斗式木构大架告成！";
                const descEl = document.getElementById('hud-desc');
                if (descEl) descEl.textContent = "五柱七檩，榫卯紧扣，无钉无胶而立千年。可拖拽鼠标漫游或悬停查看构件。";
                const tourControls = document.getElementById('tour-controls');
                if (tourControls) {
                    tourControls.classList.add('visible');
                }
            }, null, currentTime + 2.0);
        }

        function resetAndPlayGrowth() {
            if (animationTimeline) {
                animationTimeline.kill();
            }
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(controls.target);
            gsap.killTweensOf(scanUniforms.scanY);
            gsap.killTweensOf(shaderUniforms.u_scanY);
            
            // 重置所有构件3D标签状态
            componentBadges.forEach(badge => {
                badge.visible = false;
                badge.status = 'hidden';
                badge.element.className = 'comp-badge';
                badge.element.style.display = 'none';
            });
            hoveredBadgeName = null;

            Object.values(loadedComponentMap).forEach(mesh => {
                if (mesh.userData.category === 'roofs') {
                    if (mesh.material) {
                        mesh.material.transparent = true;
                        mesh.material.opacity = 0;
                        mesh.material.depthWrite = false;
                        mesh.material.emissiveIntensity = 0;
                        mesh.material.color.setHex(0x8B4513);
                    }
                    if (mesh.userData.originalPosition) {
                        mesh.position.copy(mesh.userData.originalPosition);
                        mesh.position.y += CONFIG.skyHeight;
                    }
                    if (mesh.userData.originalRotation) {
                        mesh.rotation.copy(mesh.userData.originalRotation);
                    }
                } else {
                    setupComponentAsSky(mesh);
                    if (mesh.userData.originalRotation) {
                        mesh.rotation.copy(mesh.userData.originalRotation);
                    }
                }
            });

            chartData = [0];
            chartStep = 0;
            if (stressChart) {
                stressChart.setOption({ series: [{ data: [0] }] });
            }

            camera.position.set(16, 6, 20);
            controls.target.set(0, 3, 0);
            controls.update();

            playGrowthAnimation();
        }

        let isPaused = false;

        function setupHUDControls() {
            const playPauseBtn = document.getElementById('hud-btn-playpause');
            const restartBtn = document.getElementById('hud-btn-restart');

            if (playPauseBtn) {
                playPauseBtn.addEventListener('click', () => {
                    if (!animationTimeline) return;
                    if (isPaused) {
                        animationTimeline.play();
                        isPaused = false;
                        playPauseBtn.textContent = '⏸️ 暂停';
                    } else {
                        animationTimeline.pause();
                        isPaused = true;
                        playPauseBtn.textContent = '▶️ 继续';
                    }
                });
            }

            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    isPaused = false;
                    if (playPauseBtn) playPauseBtn.textContent = '⏸️ 暂停';
                    resetAndPlayGrowth();
                });
            }
        }

        function triggerEmissiveFlash(mesh) {
            if (!mesh || !mesh.material || !mesh.material.emissive) return;
            gsap.to(mesh.material, {
                emissiveIntensity: 0.55,
                duration: 0.4,
                ease: "power1.in",
                onComplete: () => {
                    gsap.to(mesh.material, {
                        emissiveIntensity: 0,
                        duration: 0.8,
                        ease: "power1.out"
                    });
                }
            });
            mesh.material.emissive.setHex(0xD4B984);
        }

        function triggerGlobalGlow() {
            const allMeshes = [...columns, ...chuanfangArray, ...jinfangArray, ...guazhuArray, ...linArray, ...roofs];
            allMeshes.forEach((mesh, index) => {
                if (!mesh || !mesh.material || !mesh.material.emissive) return;
                gsap.to(mesh.material, {
                    emissiveIntensity: 0.25,
                    duration: 0.8,
                    delay: index * 0.03,
                    onComplete: () => {
                        gsap.to(mesh.material, {
                            emissiveIntensity: 0,
                            duration: 1.2,
                            delay: 0.4
                        });
                    }
                });
                mesh.material.emissive.setHex(0xD4B984);
            });
        }

        function setupScrollInteraction() {
            let mouseNearEdge = false;
            let edgeDir = 0;
            window.addEventListener('mousemove', (e) => {
                const edgeThreshold = Math.min(50, window.innerHeight * 0.06);
                if (e.clientY <= edgeThreshold) {
                    mouseNearEdge = true;
                    edgeDir = -1;
                } else if (e.clientY >= window.innerHeight - edgeThreshold) {
                    mouseNearEdge = true;
                    edgeDir = 1;
                } else {
                    mouseNearEdge = false;
                    edgeDir = 0;
                }
            });

            window.addEventListener('wheel', (event) => {
                if (mouseNearEdge) {
                    if (edgeDir === -1 && event.deltaY < -20) {
                        event.preventDefault();
                        if (window.parent && window.parent !== window) {
                            window.parent.postMessage({ type: 'fullpage-nav-prev' }, '*');
                        }
                    } else if (edgeDir === 1 && event.deltaY > 20) {
                        event.preventDefault();
                        if (window.parent && window.parent !== window) {
                            window.parent.postMessage({ type: 'fullpage-nav-next' }, '*');
                        }
                    }
                }
            }, { passive: false });
        }

        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            checkHover();
            updateAllBadges();
            composer.render();
        }

        function setupTourControls() {
            const btnGlobal = document.getElementById('btn-view-global');
            const btnProfile = document.getElementById('btn-view-profile');
            const btnReset = document.getElementById('btn-view-reset');

            function moveToView(camPos, targetPos) {
                gsap.to(camera.position, {
                    x: camPos.x, y: camPos.y, z: camPos.z,
                    duration: 2,
                    ease: "power3.inOut",
                    onUpdate: () => controls.update()
                });
                gsap.to(controls.target, {
                    x: targetPos.x, y: targetPos.y, z: targetPos.z,
                    duration: 2,
                    ease: "power3.inOut",
                    onUpdate: () => controls.update()
                });
            }

            if (btnGlobal) btnGlobal.addEventListener('click', () => moveToView({x: 0.1, y: 25, z: 0.1}, {x: 0, y: 0, z: 0}));
            if (btnProfile) btnProfile.addEventListener('click', () => moveToView({x: 22, y: 5, z: 0}, {x: 0, y: 5, z: 0}));
            if (btnReset) btnReset.addEventListener('click', () => moveToView({x: 16, y: 8, z: 16}, {x: 0, y: 2, z: 0}));
        }

        function setupRestartButton() {
            const btn = document.getElementById('btn-restart-growth');
            if (btn) {
                btn.addEventListener('click', resetAndPlayGrowth);
            }
        }

        async function main() {
            initECharts();
            initHUD();
            setupHUDControls();
            setupTourControls();
            setupRestartButton();

            initScene();
            animate();
            setupScrollInteraction();

            await loadModel();
            
            const modal = document.getElementById('growth-modal');
            const startBtn = document.getElementById('btn-start-growth');
            const cancelBtn = document.getElementById('btn-cancel-growth');
            
            function hideGrowthModal() {
                const el = document.getElementById('growth-modal');
                if (el) {
                    el.style.display = 'none';
                }
            }

            function handleStartGrowth() {
                hideGrowthModal();
                resetAndPlayGrowth();
            }

            function handleCancelGrowth() {
                // 点击“否”时不关闭弹窗，不触发动效或提示
            }

            window.startGrowth = handleStartGrowth;
            window.cancelGrowth = handleCancelGrowth;
            
            if (modal) modal.style.display = 'flex';
            if (startBtn) startBtn.addEventListener('click', handleStartGrowth);
            if (cancelBtn) cancelBtn.addEventListener('click', handleCancelGrowth);
        }
        main();
    