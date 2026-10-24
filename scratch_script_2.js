
const config = {
            snapDistance: 0.8,
            animationSpeed: 0.3,
            showHelpOnStart: true
        };
        const level1PartsData = [
            {
                id: 'dijiaofang',
                name: '地脚枋',
                x: 0,
                y: 0.04,
                z: 0,
                w: 4.8,
                h: 0.08,
                d: 0.15,
                type: 'box',
                order: 1,
                success: {
                    quote: '《营造法式》：“地脚枋承柱于地，稳固根基。”',
                    source: '——宋《营造法式》',
                    exp: '地脚枋将左右及中柱底部连成整体，防止沉降不均，是单榀排架的根基。'
                },
                error: {
                    quote: '《营造法式》：“柱无地脚，则倾覆随之。”',
                    source: '——宋',
                    exp: '必须先安放地脚枋稳固根基，方可立柱！'
                }
            },
            {
                id: 'zuo_zhu',
                name: '左柱（外檐立木）',
                x: -2.2,
                y: 1.25,
                z: 0,
                r: 0.09,
                h: 2.5,
                type: 'cylinder',
                order: 2,
                success: {
                    quote: '《营造法式》：“柱者，建筑之骨也，立木为干。”',
                    source: '——宋《营造法式》',
                    exp: '左侧圆柱矗立，承担左翼垂直重力，确立开间基准。'
                },
                error: {
                    quote: '《营造法式》：“基未定，柱不可立。”',
                    source: '——宋',
                    exp: '必须先铺设地脚枋，再立外檐左柱！'
                }
            },
            {
                id: 'you_zhu',
                name: '右柱（外檐立木）',
                x: 2.2,
                y: 1.25,
                z: 0,
                r: 0.09,
                h: 2.5,
                type: 'cylinder',
                order: 2,
                success: {
                    quote: '《营造法式》：“左右并立，虚实相应，开间自成。”',
                    source: '——宋《营造法式》',
                    exp: '右侧圆柱对称立起，与左柱共同支撑排架左右两翼。'
                },
                error: {
                    quote: '《营造法式》：“基未定，柱不可立。”',
                    source: '——宋',
                    exp: '请先铺好地脚枋！'
                }
            },
            {
                id: 'chuanfang_xia',
                name: '大穿枋（贯柱主枋）',
                x: 0,
                y: 2.45,
                z: 0,
                w: 5.2,
                h: 0.16,
                d: 0.1,
                type: 'box',
                order: 3,
                success: {
                    quote: '《工程做法》：“穿枋贯通各柱，使成一体，立千年而不摇。”',
                    source: '——清《工程做法》',
                    exp: '核心穿斗构件！矩形大穿枋横穿左柱、右柱，锁紧整个排架骨架。'
                },
                error: {
                    quote: '《工程做法》：“柱未立而枋安施，倒悬之患也。”',
                    source: '——清',
                    exp: '没有柱子就无法穿插横枋，请先立檐柱！'
                }
            },
            {
                id: 'zhong_zhu',
                name: '中柱（通天脊柱）',
                x: 0,
                y: 1.95,
                z: 0,
                r: 0.1,
                h: 3.9,
                type: 'cylinder',
                order: 4,
                success: {
                    quote: '《鲁班经》：“中柱直贯九霄，正梁千秋之主。”',
                    source: '——明《鲁班经》',
                    exp: '中柱最长，立于大木中心直抵屋脊，托起中央大脊檩。'
                },
                error: {
                    quote: '《鲁班经》：“横架未锁，中柱难立。”',
                    source: '——明',
                    exp: '必须先穿插好大穿枋，中柱才有所依靠！'
                }
            },
            {
                id: 'zuo_tiaofang',
                name: '左挑枋（出檐翼木）',
                x: -2.4,
                y: 2.52,
                z: 0,
                w: 0.9,
                h: 0.12,
                d: 0.09,
                type: 'box',
                order: 5,
                success: {
                    quote: '《营造法式》：“挑枋出挑，以承飞檐，遮风庇雨。”',
                    source: '——宋《营造法式》',
                    exp: '挑枋向左侧悬挑，承接左檐檩，舒展川西建筑特有深远出檐。'
                },
                error: {
                    quote: '《营造法式》：“中主未成，挑枋何依？”',
                    source: '——宋',
                    exp: '需在中柱与主框架稳固后安放挑枋！'
                }
            },
            {
                id: 'you_tiaofang',
                name: '右挑枋（出檐翼木）',
                x: 2.4,
                y: 2.52,
                z: 0,
                w: 0.9,
                h: 0.12,
                d: 0.09,
                type: 'box',
                order: 5,
                success: {
                    quote: '《营造法式》：“双挑展翅，出檐深远。”',
                    source: '——宋《营造法式》',
                    exp: '右挑枋对称挑出，承托右侧檐口重量。'
                },
                error: {
                    quote: '《营造法式》：“中主未成，挑枋何依？”',
                    source: '——宋',
                    exp: '请先立好主框架中柱！'
                }
            },
            {
                id: 'zuo_gua_zhu',
                name: '左瓜柱（阶梯短柱）',
                x: -1.3,
                y: 2.75,
                z: 0,
                w: 0.1,
                h: 0.55,
                d: 0.1,
                type: 'box',
                order: 6,
                success: {
                    quote: '《梓人遗制》：“立瓜柱于枋上，逐层步架，抬举屋面。”',
                    source: '——元《梓人遗制》',
                    exp: '瓜柱立于穿枋之上，形成抬梁步架，举起屋面优美坡度。'
                },
                error: {
                    quote: '《梓人遗制》：“无梁置柱，凭空何托？”',
                    source: '——元',
                    exp: '瓜柱必须安放于牢固大穿枋之上！'
                }
            },
            {
                id: 'you_gua_zhu',
                name: '右瓜柱（阶梯短柱）',
                x: 1.3,
                y: 2.75,
                z: 0,
                w: 0.1,
                h: 0.55,
                d: 0.1,
                type: 'box',
                order: 6,
                success: {
                    quote: '《梓人遗制》：“瓜柱对称步升，举折如翼。”',
                    source: '——元《梓人遗制》',
                    exp: '右侧瓜柱对称立起，构筑双坡抬梁骨架。'
                },
                error: {
                    quote: '《梓人遗制》：“无梁置柱，凭空何托？”',
                    source: '——元',
                    exp: '请先铺放大穿枋与挑枋！'
                }
            },
            {
                id: 'chuanfang_zhong',
                name: '中穿枋（腰串联系枋）',
                x: 0,
                y: 3.02,
                z: 0,
                w: 3.2,
                h: 0.14,
                d: 0.1,
                type: 'box',
                order: 7,
                success: {
                    quote: '《工程做法》：“腰枋横锁，瓜柱与中柱遂成一体。”',
                    source: '——清《工程做法》',
                    exp: '中层横枋穿过左右瓜柱并紧扣中柱，强化排架中段刚度。'
                },
                error: {
                    quote: '《工程做法》：“瓜柱未全，不可施枋。”',
                    source: '——清',
                    exp: '须先立好瓜柱再穿入中枋！'
                }
            },
            {
                id: 'shang_liang',
                name: '上穿枋（顶架横梁）',
                x: 0,
                y: 3.45,
                z: 0,
                w: 2.0,
                h: 0.12,
                d: 0.09,
                type: 'box',
                order: 8,
                success: {
                    quote: '《营造法式》：“梁枋交固，单榀大成，立柱横穿，千年不倾！”',
                    source: '——宋《营造法式》',
                    exp: '上穿枋锁定近脊瓜柱，第一关单榀平面排架完整竣工！'
                },
                error: {
                    quote: '《营造法式》：“层构未具，梁安得立？”',
                    source: '——宋',
                    exp: '请先完成中层构件顺序！'
                }
            }
        ];

        const level2PartsData = [
            {
                id: 'hou_dijiaofang',
                name: '后排架·地脚枋',
                x: 0,
                y: 0.04,
                z: -1.4,
                w: 4.8,
                h: 0.08,
                d: 0.15,
                type: 'box',
                order: 1,
                success: {
                    quote: '《营造法式》：“进深双立，前后连步，先定后阶之基。”',
                    source: '——宋《营造法式》',
                    exp: '在进深后侧（Z = -1.4）奠定后排架的稳固地基。'
                },
                error: {
                    quote: '《营造法式》：“未立后基，何以成双榀之势？”',
                    source: '——宋',
                    exp: '立体开间必须先在后侧打下后地脚枋！'
                }
            },
            {
                id: 'hou_zuo_zhu',
                name: '后排架·左圆柱',
                x: -2.2,
                y: 1.25,
                z: -1.4,
                r: 0.09,
                h: 2.5,
                type: 'cylinder',
                order: 2,
                success: {
                    quote: '《营造法式》：“后柱与前柱遥相呼应，开间进深自此分明。”',
                    source: '——宋《营造法式》',
                    exp: '后排架左圆柱立起，与前左柱遥遥对应。'
                },
                error: {
                    quote: '《营造法式》：“基未成，柱不可立。”',
                    source: '——宋',
                    exp: '必须先安放后地脚枋，再立后圆柱！'
                }
            },
            {
                id: 'hou_you_zhu',
                name: '后排架·右圆柱',
                x: 2.2,
                y: 1.25,
                z: -1.4,
                r: 0.09,
                h: 2.5,
                type: 'cylinder',
                order: 2,
                success: {
                    quote: '《营造法式》：“左右并立，四角安稳。”',
                    source: '——宋《营造法式》',
                    exp: '四角立木全部就位，房屋进深开间格局基本确立。'
                },
                error: {
                    quote: '《营造法式》：“基未成，柱不可立。”',
                    source: '——宋',
                    exp: '必须先打好后排架地基！'
                }
            },
            {
                id: 'hou_chuanfang',
                name: '后排架·大穿枋',
                x: 0,
                y: 2.45,
                z: -1.4,
                w: 5.2,
                h: 0.16,
                d: 0.1,
                type: 'box',
                order: 3,
                success: {
                    quote: '《工程做法》：“穿枋贯柱，后架遂固。”',
                    source: '——清《工程做法》',
                    exp: '横穿后檐柱，使后排架形成完整的受力立面。'
                },
                error: {
                    quote: '《工程做法》：“柱未立全，穿枋安施？”',
                    source: '——清',
                    exp: '请先立好后排架左右圆柱！'
                }
            },
            {
                id: 'hou_zhong_zhu',
                name: '后排架·中柱',
                x: 0,
                y: 1.95,
                z: -1.4,
                r: 0.1,
                h: 3.9,
                type: 'cylinder',
                order: 4,
                success: {
                    quote: '《鲁班经》：“前后两中柱，遥托大脊梁。”',
                    source: '——明《鲁班经》',
                    exp: '后中柱耸立，与前中柱共同准备托起全屋最高脊檩！'
                },
                error: {
                    quote: '《鲁班经》：“横架未锁，中柱难立。”',
                    source: '——明',
                    exp: '请先安装后排架穿枋！'
                }
            },
            {
                id: 'jinfang_zuo',
                name: '左侧纵向金枋（跨进深）',
                x: -2.2,
                y: 2.45,
                z: 0,
                w: 0.12,
                h: 0.16,
                d: 2.8,
                type: 'box',
                order: 5,
                success: {
                    quote: '《营造法式》：“金枋贯联前后双榀，纵横咬合，化面为体！”',
                    source: '——宋《营造法式》',
                    exp: '三维构架精髓！左金枋沿进深跨越2.8米，牢牢拉紧前后双榀排架！'
                },
                error: {
                    quote: '《营造法式》：“前后两榀未成，金枋安能横渡？”',
                    source: '——宋',
                    exp: '后排架未完整确立前，无法搭设跨排架的纵向金枋！'
                }
            },
            {
                id: 'jinfang_you',
                name: '右侧纵向金枋（跨进深）',
                x: 2.2,
                y: 2.45,
                z: 0,
                w: 0.12,
                h: 0.16,
                d: 2.8,
                type: 'box',
                order: 5,
                success: {
                    quote: '《营造法式》：“右枋亦通，立体骨架巍然落定，抗震摇晃而不倒！”',
                    source: '——宋《营造法式》',
                    exp: '左右双金枋形成坚固空间刚度，穿斗建筑立体骨架正式成型！'
                },
                error: {
                    quote: '《营造法式》：“前后两榀未成，金枋安能横渡？”',
                    source: '——宋',
                    exp: '请先完成前后双榀排架的基础立木。'
                }
            },
            {
                id: 'yanlin_zuo',
                name: '左檐·圆木檩条',
                x: -2.8,
                y: 2.55,
                z: 0,
                r: 0.08,
                len: 4.0,
                type: 'purlin',
                order: 6,
                success: {
                    quote: '《工程做法》：“檐檩施于挑头，承接前坡椽瓦。”',
                    source: '——清《工程做法》',
                    exp: '天然原木圆形檩条，横卧于左侧挑枋之巅，贯通前后出檐。'
                },
                error: {
                    quote: '《工程做法》：“纵向骨架未成，檩条不可设。”',
                    source: '——清',
                    exp: '必须先安装好纵向金枋，稳固整体空间框架！'
                }
            },
            {
                id: 'yanlin_you',
                name: '右檐·圆木檩条',
                x: 2.8,
                y: 2.55,
                z: 0,
                r: 0.08,
                len: 4.0,
                type: 'purlin',
                order: 6,
                success: {
                    quote: '《工程做法》：“后檐齐备，双翼舒展。”',
                    source: '——清《工程做法》',
                    exp: '右檐圆木檩条安放就位，横跨4米，奠定双坡出檐基准。'
                },
                error: {
                    quote: '《工程做法》：“纵向骨架未成，檩条不可设。”',
                    source: '——清',
                    exp: '请先用金枋贯穿前后双榀！'
                }
            },
            {
                id: 'da_jiling',
                name: '中央大脊檩（中天顶心木）',
                x: 0,
                y: 3.9,
                z: 0,
                r: 0.09,
                len: 4.0,
                type: 'purlin',
                order: 7,
                success: {
                    quote: '《鲁班经》：“上梁大吉！正脊高耸，贯穿前后，四水归堂！”',
                    source: '——明《鲁班经》',
                    exp: '上梁大吉！圆木大脊檩横跨于前后两根中柱最高顶峰，全屋骨架大定！'
                },
                error: {
                    quote: '《鲁班经》：“檐檩未定，正脊不可升！”',
                    source: '——明',
                    exp: '大脊檩必须在檐檩铺就后，安放在前后中柱最高顶点！'
                }
            },
            {
                id: 'liti_wuding',
                name: '悬山双坡深灰大屋顶',
                x: 0,
                y: 3.25,
                z: 0,
                w: 6.4,
                h: 1.45,
                d: 4.2,
                type: 'gabled_3d',
                order: 8,
                success: {
                    quote: '《营造法式》：“悬山双坡，覆压开间，出檐深远，四水归堂。”',
                    source: '——宋《营造法式》',
                    exp: '深灰双坡悬山屋面完美合拢覆压，出檐深远，川西穿斗古建立体营造彻底大成！'
                },
                error: {
                    quote: '《营造法式》：“大梁未定，瓦不可覆。”',
                    source: '——宋',
                    exp: '必须先安放好中央大脊檩与檐檩，才能整体覆上大屋顶！'
                }
            }
        ];

        let currentLevel = 1;
        let level1Completed = false;
        let level2Completed = false;
        let partsData = level1PartsData;
        let frontBentGroup = null;

        // 3D 视角环绕控制变量（第二关使用）
        let isOrbiting = false;
        let orbitStart = { x: 0, y: 0 };
        let camRadius = 9.5;
        let camTheta = 0.75;
        let camPhi = Math.PI / 2.7;
        const camTarget = new THREE.Vector3(0, 2.0, 0);
        let rotationAnimId = null;

        let scene, camera, renderer, raycaster, mouse;
        let draggableObjects = [];
        let targetZones = [];
        let placedParts = [];
        let isDragging = false;
        let draggedObject = null;
        let dragOffset = new THREE.Vector3();
        let dragPlane = new THREE.Plane();
        let builtGroup = null;
        let errorCount = {};
        let isReturningToOriginal = false;
        let gameStartTime = null;

        // 材质定义（严格按照真实穿斗建筑及参考图质感配置）
        const colMat = new THREE.MeshStandardMaterial({
            color: 0x824422, // 暖红棕色木圆柱
            roughness: 0.65,
            metalness: 0.06
        });
        const beamMat = new THREE.MeshStandardMaterial({
            color: 0x5a2d16, // 深栗木色穿枋
            roughness: 0.7,
            metalness: 0.05
        });
        const purlinMat = new THREE.MeshStandardMaterial({
            color: 0xd4b483, // 浅色天然圆木檩条
            roughness: 0.55,
            metalness: 0.05
        });
        const roofMat = new THREE.MeshStandardMaterial({
            color: 0x363d45, // 深石灰瓦青坡面
            roughness: 0.85,
            metalness: 0.05,
            side: THREE.DoubleSide
        });

        function createPartMesh(part) {
            let mesh;
            if (part.type === 'cylinder') {
                const geo = new THREE.CylinderGeometry(part.r, part.r, part.h, 24);
                mesh = new THREE.Mesh(geo, colMat);
            } else if (part.type === 'purlin') {
                const geo = new THREE.CylinderGeometry(part.r, part.r, part.len, 24);
                mesh = new THREE.Mesh(geo, purlinMat);
                mesh.rotation.x = Math.PI / 2;
            } else if (part.type === 'gabled_3d') {
                mesh = createGabledRoof3DMesh(part.w, part.h, part.d);
            } else {
                const geo = new THREE.BoxGeometry(part.w, part.h, part.d);
                mesh = new THREE.Mesh(geo, beamMat);
            }
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            return mesh;
        }

        function createGabledRoof3DMesh(w, h, d) {
            const roofGroup = new THREE.Group();
            const slopeLen = Math.hypot(h, w / 2);
            const slopeAngle = Math.atan2(h, w / 2);

            // 左坡屋顶（深灰石板瓦厚板）
            const leftSlopeGeo = new THREE.BoxGeometry(slopeLen, 0.05, d);
            const leftSlope = new THREE.Mesh(leftSlopeGeo, roofMat);
            leftSlope.position.set(-w / 4, h * 0.45, 0);
            leftSlope.rotation.z = slopeAngle;
            leftSlope.castShadow = true;
            leftSlope.receiveShadow = true;
            roofGroup.add(leftSlope);

            // 右坡屋顶（深灰石板瓦厚板）
            const rightSlopeGeo = new THREE.BoxGeometry(slopeLen, 0.05, d);
            const rightSlope = new THREE.Mesh(rightSlopeGeo, roofMat);
            rightSlope.position.set(w / 4, h * 0.45, 0);
            rightSlope.rotation.z = -slopeAngle;
            rightSlope.castShadow = true;
            rightSlope.receiveShadow = true;
            roofGroup.add(rightSlope);

            // 正脊顶吻
            const ridgeGeo = new THREE.BoxGeometry(0.2, 0.12, d + 0.1);
            const ridge = new THREE.Mesh(ridgeGeo, purlinMat);
            ridge.position.set(0, h * 0.98, 0);
            ridge.castShadow = true;
            ridge.receiveShadow = true;
            roofGroup.add(ridge);

            return roofGroup;
        }

        function createGabledRoof3DZone(w, h, d) {
            const roofGroup = new THREE.Group();
            const roofWireMat = new THREE.MeshBasicMaterial({
                color: 0xc9a227,
                transparent: true,
                opacity: 0.18,
                wireframe: true,
                side: THREE.DoubleSide
            });

            const slopeLen = Math.hypot(h, w / 2);
            const slopeAngle = Math.atan2(h, w / 2);

            // 前后坡轮廓
            const leftSlope = new THREE.Mesh(new THREE.PlaneGeometry(slopeLen, d), roofWireMat);
            leftSlope.position.set(-w / 4, h * 0.45, 0);
            leftSlope.rotation.y = Math.PI / 2;
            leftSlope.rotation.x = -slopeAngle;
            roofGroup.add(leftSlope);

            const rightSlope = new THREE.Mesh(new THREE.PlaneGeometry(slopeLen, d), roofWireMat);
            rightSlope.position.set(w / 4, h * 0.45, 0);
            rightSlope.rotation.y = Math.PI / 2;
            rightSlope.rotation.x = slopeAngle;
            roofGroup.add(rightSlope);

            return roofGroup;
        }

        function createTargetZones() {
            partsData.forEach(part => {
                const zoneGroup = new THREE.Group();
                zoneGroup.position.set(part.x, part.y, part.z);

                let zone;

                if (part.type === 'cylinder') {
                    const zoneGeo = new THREE.CylinderGeometry(part.r * 1.6, part.r * 1.6, part.h * 1.05, 16);
                    const zoneMat = new THREE.MeshBasicMaterial({
                        color: 0xc9a227,
                        transparent: true,
                        opacity: 0.18,
                        wireframe: true
                    });
                    zone = new THREE.Mesh(zoneGeo, zoneMat);
                    const edges = new THREE.EdgesGeometry(zoneGeo);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xc9a227, opacity: 0.65, transparent: true }));
                    zoneGroup.add(line);
                } else if (part.type === 'purlin') {
                    const zoneGeo = new THREE.CylinderGeometry(part.r * 1.6, part.r * 1.6, part.len * 1.02, 16);
                    const zoneMat = new THREE.MeshBasicMaterial({
                        color: 0xc9a227,
                        transparent: true,
                        opacity: 0.18,
                        wireframe: true
                    });
                    zone = new THREE.Mesh(zoneGeo, zoneMat);
                    zone.rotation.x = Math.PI / 2;
                    const edges = new THREE.EdgesGeometry(zoneGeo);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xc9a227, opacity: 0.65, transparent: true }));
                    line.rotation.x = Math.PI / 2;
                    zoneGroup.add(line);
                } else if (part.type === 'gabled_3d') {
                    zone = createGabledRoof3DZone(part.w, part.h, part.d);
                } else {
                    const zoneW = part.w * 1.06;
                    const zoneH = part.h * 1.6;
                    const zoneD = part.d * 1.6;
                    const zoneGeo = new THREE.BoxGeometry(zoneW, zoneH, zoneD);
                    const zoneMat = new THREE.MeshBasicMaterial({
                        color: 0xc9a227,
                        transparent: true,
                        opacity: 0.18,
                        wireframe: true
                    });
                    zone = new THREE.Mesh(zoneGeo, zoneMat);
                    const edges = new THREE.EdgesGeometry(zoneGeo);
                    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xc9a227, opacity: 0.65, transparent: true }));
                    zoneGroup.add(line);
                }

                zoneGroup.add(zone);
                zoneGroup.userData = { partId: part.id, isZone: true, zoneMesh: zone };
                scene.add(zoneGroup);
                targetZones.push(zoneGroup);
            });
        }

        // 第二关创建基底：第一关竣工的前排架与中间4根支托檩条（严格复现参考图模型）
        function createFrontBentGroup() {
            if (frontBentGroup) {
                scene.remove(frontBentGroup);
                frontBentGroup = null;
            }

            frontBentGroup = new THREE.Group();

            // 前排架（Z = 1.4）
            level1PartsData.forEach(p => {
                const mesh = createPartMesh(p);
                mesh.position.set(p.x, p.y, 1.4);
                frontBentGroup.add(mesh);
            });

            // 附带横跨双榀的中间4根金檩（与参考图一致）
            const midPurlins = [
                { x: -1.8, y: 3.0, r: 0.08, len: 4.0 },
                { x: -0.9, y: 3.45, r: 0.08, len: 4.0 },
                { x: 0.9, y: 3.45, r: 0.08, len: 4.0 },
                { x: 1.8, y: 3.0, r: 0.08, len: 4.0 }
            ];
            midPurlins.forEach(p => {
                const purlinMesh = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, p.len, 20), purlinMat);
                purlinMesh.rotation.x = Math.PI / 2;
                purlinMesh.position.set(p.x, p.y, 0);
                purlinMesh.castShadow = true;
                purlinMesh.receiveShadow = true;
                frontBentGroup.add(purlinMesh);
            });

            scene.add(frontBentGroup);
        }

        function createDraggableParts() {
            const startX = currentLevel === 1 ? -4.8 : -5.0;
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
                { x: startX, y: 2.4, z: -1.3 },  
                { x: startX, y: 0.3, z: -1.3 }  
            ];

            partsData.forEach((part, index) => {
                const mesh = createPartMesh(part);

                const pos = positions[index % positions.length];
                const displayH = part.h || (part.r ? part.r * 2 : 0.5);
                const minY = displayH / 2 + 0.2;
                mesh.position.set(
                    pos.x + (Math.random() - 0.5) * 0.2,
                    Math.max(minY, pos.y),
                    pos.z + (Math.random() - 0.5) * 0.3
                );

                mesh.userData = {
                    partId: part.id,
                    partData: part,
                    isDraggable: true,
                    originalPos: mesh.position.clone()
                };

                scene.add(mesh);
                draggableObjects.push(mesh);
            });
        }

        function createUI() {
            const container = document.getElementById('partsContainer');
            container.innerHTML = '';
            partsData.forEach(part => {
                const div = document.createElement('div');
                div.className = 'part-item';
                div.id = 'ui-' + part.id;
                div.textContent = part.name;
                div.draggable = false;
                container.appendChild(div);
            });

            document.getElementById('totalNum').textContent = partsData.length;
            document.getElementById('progressNum').textContent = '0';
            document.getElementById('progressFill').style.width = '0%';
        }

        function setupEvents() {
            const canvas = renderer.domElement;

            canvas.addEventListener('mousedown', onMouseDown);
            canvas.addEventListener('mousemove', onMouseMove);
            canvas.addEventListener('mouseup', onMouseUp);
            canvas.addEventListener('wheel', onWheel, { passive: false });
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
            canvas.addEventListener('touchstart', onTouchStart, { passive: false });
            canvas.addEventListener('touchmove', onTouchMove, { passive: false });
            canvas.addEventListener('touchend', onTouchEnd);

            window.addEventListener('resize', onResize);
            document.getElementById('restartBtn').addEventListener('click', restartCurrentLevel);
        }

        // 3D 视角切换器
        function setCameraView(preset) {
            if (rotationAnimId) {
                cancelAnimationFrame(rotationAnimId);
                rotationAnimId = null;
            }
            if (preset === 'perspective') {
                camTheta = 0.75;
                camPhi = Math.PI / 2.7;
                camRadius = 10.5;
            } else if (preset === 'front') {
                camTheta = 0;
                camPhi = Math.PI / 2.05;
                camRadius = 9.5;
            } else if (preset === 'side') {
                camTheta = Math.PI / 2;
                camPhi = Math.PI / 2.1;
                camRadius = 9.5;
            } else if (preset === 'top') {
                camTheta = 0;
                camPhi = 0.2;
                camRadius = 11.0;
            }
            updateCameraFromOrbit();
        }

        function updateCameraFromOrbit() {
            camPhi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, camPhi));
            camera.position.x = camTarget.x + camRadius * Math.sin(camPhi) * Math.sin(camTheta);
            camera.position.y = camTarget.y + camRadius * Math.cos(camPhi);
            camera.position.z = camTarget.z + camRadius * Math.sin(camPhi) * Math.cos(camTheta);
            camera.lookAt(camTarget);
        }

        function onWheel(e) {
            e.preventDefault();
            if (currentLevel === 2) {
                camRadius += e.deltaY * 0.008;
                camRadius = Math.max(4.5, Math.min(18.0, camRadius));
                updateCameraFromOrbit();
            }
        }

        function getMousePos(event) {
            const rect = renderer.domElement.getBoundingClientRect();
            return {
                x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
                y: -((event.clientY - rect.top) / rect.height) * 2 + 1
            };
        }
// AI辅助生成：Kimi-k2.5, 2026-04-05
        function onMouseDown(event) {
            // 右键或者中键：用于 3D 旋转视角
            if (event.button === 2 || event.button === 1) {
                if (currentLevel === 2) {
                    isOrbiting = true;
                    orbitStart.x = event.clientX;
                    orbitStart.y = event.clientY;
                }
                return;
            }

            const pos = getMousePos(event);
            mouse.set(pos.x, pos.y);

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(draggableObjects, true);

            if (intersects.length > 0) {
                let obj = intersects[0].object;
                while (obj.parent && obj.parent !== scene) {
                    if (obj.userData.isDraggable) {
                        break;
                    }
                    obj = obj.parent;
                }

                if (obj.userData.isDraggable && !placedParts.includes(obj.userData.partId)) {
                    isDragging = true;
                    draggedObject = obj;
                    obj.userData.originalPos = obj.position.clone();

                    if (currentLevel === 1) {
                        dragPlane.setFromNormalAndCoplanarPoint(
                            new THREE.Vector3(0, 0, 1),
                            obj.position
                        );
                    } else {
                        // 3D 模式下：拖拽平面始终正对相机法线
                        const camDir = new THREE.Vector3();
                        camera.getWorldDirection(camDir);
                        camDir.negate();
                        dragPlane.setFromNormalAndCoplanarPoint(camDir, obj.position);
                    }

                    const intersect = new THREE.Vector3();
                    raycaster.ray.intersectPlane(dragPlane, intersect);
                    dragOffset.subVectors(obj.position, intersect);
                    obj.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.emissive = new THREE.Color(0x333333);
                        }
                    });
                    document.getElementById('ui-' + obj.userData.partId).classList.add('dragging');
                    document.getElementById('dragIndicator').style.display = 'block';
                }
            } else if (currentLevel === 2) {
                // 点击空白处，左键也可环绕视角
                isOrbiting = true;
                orbitStart.x = event.clientX;
                orbitStart.y = event.clientY;
            }
        }

        function onMouseMove(event) {
            if (isOrbiting && currentLevel === 2) {
                const deltaX = event.clientX - orbitStart.x;
                const deltaY = event.clientY - orbitStart.y;
                camTheta -= deltaX * 0.006;
                camPhi -= deltaY * 0.006;
                orbitStart.x = event.clientX;
                orbitStart.y = event.clientY;
                updateCameraFromOrbit();
                return;
            }

            if (!isDragging || !draggedObject) return;

            const pos = getMousePos(event);
            mouse.set(pos.x, pos.y);

            raycaster.setFromCamera(mouse, camera);

            if (currentLevel === 1) {
                dragPlane.setFromNormalAndCoplanarPoint(
                    new THREE.Vector3(0, 0, 1),
                    draggedObject.position.clone()
                );
            } else {
                const camDir = new THREE.Vector3();
                camera.getWorldDirection(camDir);
                camDir.negate();
                dragPlane.setFromNormalAndCoplanarPoint(camDir, draggedObject.position.clone());
            }

            const intersect = new THREE.Vector3();
            if (raycaster.ray.intersectPlane(dragPlane, intersect)) {
                let targetPos = intersect.add(dragOffset);
                const partId = draggedObject.userData.partId;
                const zone = targetZones.find(z => z.userData.partId === partId);
                
                if (zone && !isReturningToOriginal) {
                    const dist = targetPos.distanceTo(zone.position);
                    if (dist < config.snapDistance) {
                        const pull = 1.0 - (dist / config.snapDistance);
                        targetPos.lerp(zone.position, pull * 0.45); 
                    }
                }

                draggedObject.position.copy(targetPos);
                if (currentLevel === 1) {
                    draggedObject.position.z = THREE.MathUtils.lerp(draggedObject.position.z, 0, 0.3);
                }
            }

            const indicator = document.getElementById('dragIndicator');
            indicator.style.left = (event.clientX + 15) + 'px';
            indicator.style.top = (event.clientY - 30) + 'px';
            indicator.textContent = draggedObject.userData.partData.name;

            checkSnap();
        }

        function onMouseUp(event) {
            if (isOrbiting) {
                isOrbiting = false;
            }

            if (!isDragging || !draggedObject) return;

            const currentObj = draggedObject;
            isDragging = false; 
            draggedObject = null;
            currentObj.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive = new THREE.Color(0x000000);
                }
            });
            document.getElementById('ui-' + currentObj.userData.partId).classList.remove('dragging');
            document.getElementById('dragIndicator').style.display = 'none';
            const result = checkPlacement(currentObj);

            if (result === 'success') {
                placePart(currentObj);
            } else if (result === 'order_error') {
                returnToOriginal(currentObj, () => {});
            } else {
                showError(currentObj);
                returnToOriginal(currentObj, () => {});
            }
        }

        function onTouchStart(event) {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                onMouseDown({ clientX: touch.clientX, clientY: touch.clientY, button: 0 });
            }
        }

        function onTouchMove(event) {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
            }
        }

        function onTouchEnd(event) {
            onMouseUp({});
        }

        function checkSnap() {
            if (!draggedObject || isReturningToOriginal) return;

            const partId = draggedObject.userData.partId;
            const zone = targetZones.find(z => z.userData.partId === partId);

            if (zone) {
                const dist = draggedObject.position.distanceTo(zone.position);

                if (dist < config.snapDistance) {
                    zone.traverse((child) => {
                        if (child.material) {
                            if (child.isMesh) {
                                child.material.opacity = 0.35;
                                child.material.color.setHex(0x4caf50);
                            }
                            if (child.isLineSegments) {
                                child.material.opacity = 0.8;
                                child.material.color.setHex(0x4caf50);
                            }
                        }
                    });
                } else {
                    zone.traverse((child) => {
                        if (child.material) {
                            if (child.isMesh) {
                                child.material.opacity = 0.15;
                                child.material.color.setHex(0xc9a227);
                            }
                            if (child.isLineSegments) {
                                child.material.opacity = 0.65;
                                child.material.color.setHex(0xc9a227);
                            }
                        }
                    });
                }
            }
        }

        function showCraftsmanWelcome() {
            const dialog = document.getElementById('craftsmanDialog');
            dialog.className = 'show guide';

            if (currentLevel === 1) {
                document.getElementById('craftsmanMessage').textContent =
                    '小师傅，欢迎来到营造工坊！第一关我们将拼装单榀平面排架。这可是川西穿斗大木作的承重基础！';
                document.getElementById('craftsmanTip').textContent =
                    '记住口诀：先下后上，先柱后梁，由根及巅！拖拽左侧构件到金线框中。';
            } else {
                document.getElementById('craftsmanMessage').textContent =
                    '进阶第二关·双榀立体空间营造！前排架已在前侧立好。请先拼装后排架，再以纵向金枋穿透连结，最后覆上大屋顶！';
                document.getElementById('craftsmanTip').textContent =
                    '提示：可使用鼠标右键（或空白处左键）拖拽旋转3D视角，右上角亦有预设视角！';
            }
            setTimeout(() => {
                dialog.classList.remove('show');
            }, 6500);
        }

        function checkPlacement(obj) {
            if (!obj) return false;

            const partData = obj.userData.partData;
            const zone = targetZones.find(z => z.userData.partId === partData.id);

            if (!zone) return false;

            const dist = obj.position.distanceTo(zone.position);
            if (partData.order) {
                const currentOrder = partData.order;
                const maxPlacedOrder = placedParts.length === 0 ? 0 :
                    Math.max(...placedParts.map(id => {
                        const part = partsData.find(p => p.id === id);
                        return part ? part.order : 0;
                    }));

                if (currentOrder > maxPlacedOrder + 1) {
                    showOrderError(partData, currentOrder, maxPlacedOrder + 1);
                    return 'order_error';
                }
            }
            if (dist < config.snapDistance) {
                return 'success';
            } else {
                return 'position_error';
            }
        }

        function showOrderError(partData, currentOrder, expectedOrder) {
            const orderNamesLvl1 = {
                1: '地脚枋',
                2: '左柱/右柱',
                3: '穿枋（下）',
                4: '中柱',
                5: '左挑枋/右挑枋',
                6: '左瓜柱/右瓜柱',
                7: '上穿枋',
                8: '下穿枋'
            };

            const orderNamesLvl2 = {
                1: '后排架地脚枋',
                2: '后排架柱身（后左柱/后右柱）',
                3: '后排架穿枋',
                4: '后排架中柱',
                5: '纵向联系梁（左金枋/右金枋）',
                6: '檐檩（前檐檩/后檐檩）',
                7: '中央大脊檩',
                8: '悬山双坡立体大屋顶'
            };

            const orderNames = currentLevel === 1 ? orderNamesLvl1 : orderNamesLvl2;
            const requiredPart = orderNames[expectedOrder] || '前序构件';
            const currentPart = partData.name;
            const dialog = document.getElementById('craftsmanDialog');
            dialog.className = 'show warning';

            let message = `哎呀，${currentPart}的安装顺序不对！`;
            let tip = `按大木作营造法度，必须先安放【${requiredPart}】！`;

            document.getElementById('craftsmanMessage').textContent = message;
            document.getElementById('craftsmanTip').textContent = tip;
            setTimeout(() => {
                dialog.classList.remove('show');
            }, 5000);
        }

        function placePart(obj) {
            const partData = obj.userData.partData;
            const targetPos = new THREE.Vector3(partData.x, partData.y, partData.z);
            const startPos = obj.position.clone();

            if (!placedParts.includes(partData.id)) {
                placedParts.push(partData.id);
            }
            const progressNum = placedParts.length;
            document.getElementById('progressNum').textContent = progressNum;
            document.getElementById('progressFill').style.width = (progressNum / partsData.length * 100) + '%';

            const duration = 600; 
            const startTime = Date.now();

            function animatePlace() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 4); 

                obj.position.lerpVectors(startPos, targetPos, eased);

                if (progress < 1) {
                    requestAnimationFrame(animatePlace);
                } else {
                    draggableObjects = draggableObjects.filter(o => o !== obj);

                    document.getElementById('ui-' + partData.id).classList.add('placed');

                    const zone = targetZones.find(z => z.userData.partId === partData.id);
                    if (zone) zone.visible = false;

                    showBook(partData.success, true);

                    if (placedParts.length >= partsData.length) {
                        saveGameRecord(); 
                        setTimeout(() => {
                            if (currentLevel === 1) {
                                level1Completed = true;
                                showLevel1Complete();
                            } else {
                                level2Completed = true;
                                showLevel2Complete();
                            }
                        }, 800);
                    }
                }
            }

            animatePlace();
        }

        function showError(obj) {
            const partData = obj.userData.partData;
            const partId = partData.id;

            errorCount[partId] = (errorCount[partId] || 0) + 1;

            showBook(partData.error, false);
        }

        // 第一关通关指引进入第二关
        function showLevel1Complete() {
            targetZones.forEach(zone => zone.visible = false);
            draggableObjects.forEach(obj => scene.remove(obj));
            draggableObjects = [];

            // 弹窗指引
            const completeModal = document.getElementById('complete');
            document.getElementById('completeTitle').textContent = '🎉 第一关·单榀排架大功告成！';
            document.getElementById('completeDesc').innerHTML = 
                '小师傅好手艺！你已成功拼装完川西穿斗单榀排架（平面骨架）。<br>' +
                '但在传统真实建筑中，单榀排架绝非孤立，必须由前后双榀甚至数榀排架，' +
                '通过纵向金枋、中脊檩条与大屋顶立体贯穿，方成进深广厦！<br><br>' +
                '<strong style="color: #ffd700;">准备好挑战三维立体双榀空间营造了吗？</strong>';

            const completeActions = document.getElementById('completeButtons');
            completeActions.innerHTML = `
                <button class="btn btn-primary-gold" onclick="enterLevel2()">进阶第二关：立体双榀营造 ➔</button>
                <button class="btn btn-secondary" onclick="restartCurrentLevel()">重玩第一关</button>
                <button onclick="document.getElementById('complete').classList.remove('show'); document.getElementById('square-mode').scrollIntoView({behavior: 'smooth'});" style="background: linear-gradient(135deg, #d4b984 0%, #c4a574 100%); border:none; color:#3d2314;">🎉 逛逛广场</button>
            `;
            completeModal.classList.add('show');

            // 匠人语音指导
            const dialog = document.getElementById('craftsmanDialog');
            dialog.className = 'show guide';
            document.getElementById('craftsmanMessage').textContent =
                '太棒了！单榀排架已成。真正的传统建筑讲究“纵横交织，空间成立”。快随老朽进入第二关，挑战立体双榀空间！';
            document.getElementById('craftsmanTip').textContent =
                '点击弹窗中的【进阶第二关】或顶部关卡栏进入三维立体模式！';
        }

        // 第二关进入函数
        function enterLevel2() {
            document.getElementById('complete').classList.remove('show');
            switchToLevel(2);
        }

        // 第二关通关
        function showLevel2Complete() {
            targetZones.forEach(zone => zone.visible = false);
            draggableObjects.forEach(obj => scene.remove(obj));
            draggableObjects = [];

            const completeModal = document.getElementById('complete');
            document.getElementById('completeTitle').textContent = '🏆 大宗师！川西穿斗立体大木作圆满落成！';
            document.getElementById('completeDesc').innerHTML = 
                '天衣无缝，四水归堂！你已完整领悟川西穿斗式古建空间精髓：<br>' +
                '双榀排架由纵向金枋穿透紧扣，脊檩贯通中天，双坡悬山大屋顶覆压出檐，' +
                '抗震消能，立千年而不倒！你已成为真正的穿斗营造大宗师！';

            const completeActions = document.getElementById('completeButtons');
            completeActions.innerHTML = `
                <button class="btn btn-primary-gold" onclick="switchToLevel(1)">返回第一关温习</button>
                <button class="btn btn-secondary" onclick="restartCurrentLevel()">再次挑战第二关</button>
                <button onclick="document.getElementById('complete').classList.remove('show'); document.getElementById('square-mode').scrollIntoView({behavior: 'smooth'});" style="background: linear-gradient(135deg, #d4b984 0%, #c4a574 100%); border:none; color:#3d2314;">🎉 逛逛广场</button>
            `;
            completeModal.classList.add('show');

            // 开始 3D 环绕自转观赏立体杰作
            startRotation();
        }

        function switchToLevel(lvl) {
            currentLevel = lvl;

            if (rotationAnimId) {
                cancelAnimationFrame(rotationAnimId);
                rotationAnimId = null;
            }

            // 更新顶部切换栏与徽章
            const levelSelector = document.getElementById('levelSelector');
            const levelBadge = document.getElementById('levelBadge');
            const viewControls = document.getElementById('viewControls');
            const tab1 = document.getElementById('levelBtn1');
            const tab2 = document.getElementById('levelBtn2');

            if (lvl === 1) {
                tab1.classList.add('active');
                tab2.classList.remove('active');
                levelBadge.textContent = '第一关：单榀平面排架';
                viewControls.style.display = 'none';
                partsData = level1PartsData;
            } else {
                tab1.classList.remove('active');
                tab2.classList.add('active');
                levelBadge.textContent = '第二关：双榀空间立体营造';
                viewControls.style.display = 'flex';
                partsData = level2PartsData;
            }

            restartCurrentLevel();
        }

        function restartCurrentLevel() {
            placedParts = [];
            isDragging = false;
            draggedObject = null;
            errorCount = {};

            if (rotationAnimId) {
                cancelAnimationFrame(rotationAnimId);
                rotationAnimId = null;
            }

            // 清理场景中现存非固定物件
            const partsToRemove = [];
            scene.traverse(child => {
                if (child.userData && child.userData.partId && !child.userData.isZone) {
                    partsToRemove.push(child);
                }
            });
            partsToRemove.forEach(obj => {
                if (obj.parent) obj.parent.remove(obj);
                else scene.remove(obj);
            });
            draggableObjects = [];

            if (builtGroup) {
                scene.remove(builtGroup);
                builtGroup = null;
            }

            // 清理目标虚线框
            targetZones.forEach(z => {
                scene.remove(z);
            });
            targetZones = [];

            // 第二关创建基底：前排架
            if (currentLevel === 2) {
                createFrontBentGroup();
                setCameraView('perspective');
            } else {
                if (frontBentGroup) {
                    scene.remove(frontBentGroup);
                    frontBentGroup = null;
                }
                camera.position.set(0.3, 2.8, 9);
                camera.lookAt(0, 1.8, 0);
            }

            // 重新创建构件及虚线框
            createTargetZones();
            createDraggableParts();
            createUI();

            document.getElementById('complete').classList.remove('show');
            document.getElementById('book').classList.remove('show');

            gameStartTime = Date.now();
            showCraftsmanWelcome();
        }

        function startRotation() {
            let angle = camTheta;
            function rotate() {
                angle += 0.005;
                camera.position.x = camTarget.x + camRadius * Math.sin(camPhi) * Math.sin(angle);
                camera.position.y = camTarget.y + camRadius * Math.cos(camPhi);
                camera.position.z = camTarget.z + camRadius * Math.sin(camPhi) * Math.cos(angle);
                camera.lookAt(camTarget);
                rotationAnimId = requestAnimationFrame(rotate);
            }
            rotate();
        }

        function returnToOriginal(obj, callback) {
            isReturningToOriginal = true;
            targetZones.forEach(zone => {
                const zoneMesh = zone.userData.zoneMesh;
                if (zoneMesh) {
                    zoneMesh.traverse((child) => {
                        if (child.isMesh && child.material) {
                            child.material.opacity = 0.15;
                            child.material.color.setHex(0xc9a227);
                        }
                    });
                }
            });

            const originalPos = obj.userData.originalPos;
            const startPos = obj.position.clone();
            const duration = 400;
            const startTime = Date.now();

            function animateReturn() {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                obj.position.lerpVectors(startPos, originalPos, progress);

                if (progress < 1) {
                    requestAnimationFrame(animateReturn);
                } else {
                    isReturningToOriginal = false;
                    if (callback) callback();
                }
            }

            animateReturn();
        }

        function showBook(content, isSuccess) {
            const book = document.getElementById('book');
            book.className = 'show ' + (isSuccess ? 'success' : 'error');
            document.getElementById('bookTitle').textContent = isSuccess ? '✓ 放置正确' : '✗ 放置错误';
            document.getElementById('bookQuote').textContent = content.quote;
            document.getElementById('bookSource').textContent = content.source;
            document.getElementById('bookExp').textContent = content.exp;

            setTimeout(() => {
                book.classList.remove('show');
            }, 3500);
        }

        function saveGameRecord() {
            const completionTime = (Date.now() - gameStartTime) / 1000;
            const totalErrors = Object.values(errorCount).reduce((a, b) => a + b, 0);
            
            const token = localStorage.getItem('chuandou_token');
            if (token) {
                fetch('http://localhost:5000/api/game/records', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        completion_time: completionTime,
                        error_count: totalErrors,
                        is_completed: true,
                        level: currentLevel
                    })
                }).catch(err => {
                    console.warn('保存成绩失败:', err);
                });
            }
        }

        function onResize() {
            const container = document.querySelector('#construction-mode #scene') || document.getElementById('scene');
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }

        function closeHelp() {
            document.getElementById('helpModal').classList.remove('show');
        }

        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }

        if (document.readyState === 'complete') { setTimeout(init, 100); } else { window.addEventListener('load', init); }

        document.addEventListener('DOMContentLoaded', () => {
            const scrollContainer = document.getElementById('mainScroll');
            const toggles = document.querySelectorAll('.toggle-btn');
            const navUser = document.getElementById('navUser');
            
            function updateSquareVisibility() {
                if (!scrollContainer || !navUser) return;
                const scrollPos = scrollContainer.scrollTop;
                const windowHeight = window.innerHeight;
                const isSquare = scrollPos > windowHeight * 0.4;
                
                toggles.forEach((t, i) => {
                    if (i === 0) t.classList.toggle('active', !isSquare);
                    if (i === 1) t.classList.toggle('active', isSquare);
                });
                
                if (isSquare) {
                    navUser.classList.add('show-in-square');
                } else {
                    navUser.classList.remove('show-in-square');
                }
            }
            
            // 初始检查
            updateSquareVisibility();
            
            toggles.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const targetId = e.target.getAttribute('data-target');
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: 'smooth' });
                        const isSquare = targetId === 'square-mode';
                        if (navUser) {
                            if (isSquare) {
                                navUser.classList.add('show-in-square');
                            } else {
                                navUser.classList.remove('show-in-square');
                            }
                        }
                    }
                });
            });

            if (scrollContainer) {
                scrollContainer.addEventListener('scroll', updateSquareVisibility);
            }
        });
    