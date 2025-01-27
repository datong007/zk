import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, controls;
const parts = [];
const rotationSpeeds = {}; // 存储每个可旋转部件的速度

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    const container = document.getElementById('canvas-container');
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // 添加轨道控制
    controls = new OrbitControls(camera, renderer.domElement);

    // 添加光源
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // 创建示例零件
    createSampleParts();

    // 创建控制界面
    createControls();

    // 处理窗口大小变化
    window.addEventListener('resize', onWindowResize, false);
}

function createSampleParts() {
    // 创建文字纹理
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 128;
    canvas.height = 128;
    
    // 设置文字样式
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'black';
    context.fillText('前扣', canvas.width/2, canvas.height/2);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);

    // 所有部件使用相同的立方体几何体
    const geometry = new THREE.BoxGeometry(1, 1, 1);  // 标准1x1x1立方体

    // 保持相同的位置
    const positions = [
        new THREE.Vector3(0, 6, 0),    // 前扣 (最上面)
        new THREE.Vector3(0, 3, 0),    // 盖子
        new THREE.Vector3(0, 0, 0),    // 主体 (中间)
        new THREE.Vector3(0, -3, 0),   // 插片
        new THREE.Vector3(0, -6, 0)    // 内件 (最下面)
    ];

    const names = ['前扣', '盖子', '主体', '插片', '内件'];

    // 为每个部件创建相同的立方体
    names.forEach((name, index) => {
        let material;
        if (index === 0) { // 前扣
            material = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                map: texture
            });
        } else {
            material = new THREE.MeshPhongMaterial({
                color: Math.random() * 0xffffff
            });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(positions[index]);
        mesh.name = name;
        
        // 调整前扣的旋转，使文字朝向正面
        if (index === 0) {
            mesh.rotation.set(0, Math.PI, 0);
        }
        
        scene.add(mesh);
        parts.push(mesh);
    });

    // 调整相机位置以便能看到所有模型
    camera.position.set(5, 0, 15);
    camera.lookAt(0, 0, 0);
}

function createControls() {
    const container = document.getElementById('partControls');
    
    // 确保容器存在
    if (!container) {
        console.error('Controls container not found');
        return;
    }
    
    // 确保有零件
    if (parts.length === 0) {
        console.error('No parts available');
        return;
    }
    
    parts.forEach(part => {
        const div = document.createElement('div');
        div.className = 'part-control';
        
        const label = document.createElement('label');
        label.textContent = part.name;
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = '#' + part.material.color.getHexString();
        colorInput.addEventListener('input', (e) => {
            part.material.color.set(e.target.value);
        });
        
        div.appendChild(label);
        div.appendChild(colorInput);

        // 为所有零件添加相同的控制功能
        addAllControls(div, part);
        
        container.appendChild(div);
    });
}

// 新的统一控制函数
function addAllControls(div, part) {
    // 保存控制div的引用
    part.userData.controlDiv = div;

    // 创建控制容器
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-row';
    controlsContainer.style.display = 'flex';
    controlsContainer.style.flexWrap = 'wrap';
    controlsContainer.style.gap = '10px';
    controlsContainer.style.alignItems = 'center';
    div.appendChild(controlsContainer);

    // 创建一个对象来存储所有控制器的引用
    const controls = {
        slideX: null,
        slideY: null,
        slideZ: null
    };

    // 添加旋转速度控制
    const speedControl = document.createElement('div');
    speedControl.className = 'control-item';
    
    const speedLabel = document.createElement('label');
    speedLabel.textContent = '旋转速度: ';
    speedLabel.style.fontSize = '14px';
    speedLabel.style.fontWeight = 'bold';
    speedLabel.style.color = '#333';
    
    const speedInput = document.createElement('input');
    speedInput.type = 'range';
    speedInput.min = '0';
    speedInput.max = '5';
    speedInput.step = '0.1';
    speedInput.value = rotationSpeeds[part.name] || '0';
    speedInput.style.width = '100px';
    speedInput.addEventListener('input', (e) => {
        const speed = parseFloat(e.target.value);
        rotationSpeeds[part.name] = speed;
        if (speed === 0) {
            part.rotation[part.userData.rotationAxis || 'y'] = 0;
        }
    });
    
    speedControl.appendChild(speedLabel);
    speedControl.appendChild(speedInput);
    controlsContainer.appendChild(speedControl);

    // 添加旋转轴选择
    const axisControl = document.createElement('div');
    axisControl.className = 'control-item';
    
    const axisSelect = document.createElement('select');
    axisSelect.style.marginLeft = '5px';
    axisSelect.style.padding = '2px 4px';
    axisSelect.style.fontSize = '14px';
    axisSelect.style.fontWeight = 'bold';
    
    const axes = [
        { value: 'y', text: 'Y轴' },
        { value: 'x', text: 'X轴' },
        { value: 'z', text: 'Z轴' }
    ];
    
    axes.forEach(axis => {
        const option = document.createElement('option');
        option.value = axis.value;
        option.text = axis.text;
        axisSelect.appendChild(option);
    });

    part.userData.rotationAxis = 'y';
    axisSelect.addEventListener('change', (e) => {
        part.userData.rotationAxis = e.target.value;
    });
    
    axisControl.appendChild(axisSelect);
    controlsContainer.appendChild(axisControl);

    // 添加爆炸效果按钮
    const explodeButton = document.createElement('button');
    explodeButton.textContent = '爆炸效果';
    explodeButton.addEventListener('click', () => {
        createExplosionEffect(part);
    });
    controlsContainer.appendChild(explodeButton);

    // 添加重置按钮
    const resetButton = document.createElement('button');
    resetButton.textContent = '重置位置';
    resetButton.addEventListener('click', () => {
        const initialY = getInitialYPosition(part.name);
        
        // 关闭所有特效（除了显示/隐藏）
        const checkboxes = part.userData.controlDiv.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked && checkbox.parentElement.textContent.trim() !== '显示') {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        // 重置位置和旋转
        part.position.set(0, initialY, 0);
        part.rotation.set(0, 0, 0);
        part.scale.set(1, 1, 1);
        
        // 更新控制器值
        controls.slideX.value = '0';
        controls.slideY.value = initialY.toString();
        controls.slideZ.value = '0';
        
        // 重置旋转速度
        rotationSpeeds[part.name] = 0;
        speedInput.value = '0';
        
        renderer.render(scene, camera);
    });
    controlsContainer.appendChild(resetButton);

    // 添加位置控制
    const positions = [
        { name: '左右', axis: 'x', min: -2, max: 2 },
        { name: '上下', axis: 'y', min: -8, max: 8 },
        { name: '前后', axis: 'z', min: -2, max: 2 }
    ];

    // 创建一个专门的行来放置位置控制和按钮
    const positionAndButtonsRow = document.createElement('div');
    positionAndButtonsRow.className = 'controls-row position-buttons-row';
    controlsContainer.appendChild(positionAndButtonsRow);

    positions.forEach(pos => {
        const control = document.createElement('div');
        control.className = 'control-item';
        
        const label = document.createElement('label');
        label.textContent = `${pos.name}: `;
        label.style.fontSize = '14px';
        label.style.fontWeight = 'bold';
        label.style.color = '#333';
        
        const input = document.createElement('input');
        input.type = 'range';
        input.min = pos.min.toString();
        input.max = pos.max.toString();
        input.step = '0.1';
        input.value = part.position[pos.axis];
        input.style.width = '50px';
        input.addEventListener('input', (e) => {
            part.position[pos.axis] = parseFloat(e.target.value);
        });
        
        control.appendChild(label);
        control.appendChild(input);
        positionAndButtonsRow.appendChild(control);
        
        controls[`slide${pos.axis.toUpperCase()}`] = input;
    });

    // 添加显示控制按钮
    const visibilityControl = document.createElement('div');
    visibilityControl.className = 'control-item';
    
    const visibilityCheckbox = document.createElement('input');
    visibilityCheckbox.type = 'checkbox';
    visibilityCheckbox.checked = part.visible;
    visibilityCheckbox.id = `visibility-${part.name}`;
    
    const visibilityLabel = document.createElement('label');
    visibilityLabel.htmlFor = visibilityCheckbox.id;
    visibilityLabel.textContent = '显示';
    visibilityLabel.style.fontSize = '14px';  // 与其他标题一致
    visibilityLabel.style.fontWeight = 'bold';
    visibilityLabel.style.color = '#333';
    
    visibilityCheckbox.addEventListener('change', (e) => {
        // 更新部件可见性
        part.visible = e.target.checked;
        
        // 更新相关特效的可见性
        if (part.userData.trail) {
            part.userData.trail.visible = e.target.checked;
        }
        if (part.userData.mirrorCopy) {
            part.userData.mirrorCopy.visible = e.target.checked;
        }
        if (part.userData.rainbowRing) {
            part.userData.rainbowRing.visible = e.target.checked;
        }
        if (part.userData.lightning) {
            part.userData.lightning.visible = e.target.checked;
        }
        if (part.userData.particleSystem) {
            part.userData.particleSystem.visible = e.target.checked;
        }

        // 确保更新渲染
        renderer.render(scene, camera);
    });
    
    visibilityControl.appendChild(visibilityCheckbox);
    visibilityControl.appendChild(visibilityLabel);
    positionAndButtonsRow.appendChild(visibilityControl);

    // 添加特效控制
    const effects = [
        { name: '自旋', property: 'autoSpin' },
        { name: '轨迹', property: 'showTrail', onCreate: createTrail },
        { name: '镜像', property: 'mirrorEnabled', onCreate: createMirrorCopy, onRemove: removeMirrorCopy },
        { name: '变形', property: 'morphEnabled' },
        { name: '光环', property: 'rainbowEnabled', onCreate: createRainbowRing },
        { name: '磁力', property: 'magnetEnabled' },
        { name: '闪电', property: 'lightningEnabled', onCreate: createLightningEffect },
        { name: '粒子', property: 'particlesEnabled', onCreate: createParticleSystem }
    ];

    // 创建特效控制容器
    const effectsContainer = document.createElement('div');
    effectsContainer.className = 'controls-row';
    effectsContainer.style.marginTop = '10px';
    div.appendChild(effectsContainer);

    // 添加所有特效控制
    effects.forEach(effect => {
        const control = document.createElement('div');
        control.className = 'control-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = false;
        checkbox.id = `${effect.property}-${part.name}`;
        
        checkbox.addEventListener('change', (e) => {
            part.userData[effect.property] = e.target.checked;
            
            if (e.target.checked) {
                // 创建效果
                if (effect.onCreate) {
                    effect.onCreate(part);
                }
            } else {
                // 清理效果并恢复初始状态
                if (effect.onRemove) {
                    effect.onRemove(part);
                }
                resetEffectState(part, effect.property);
            }
            
            // 更新渲染
            renderer.render(scene, camera);
        });
        
        const label = document.createElement('label');
        label.htmlFor = checkbox.id;
        label.textContent = effect.name;
        label.style.fontSize = '14px';
        
        control.appendChild(checkbox);
        control.appendChild(label);
        effectsContainer.appendChild(control);
    });
}

// 修改效果管理函数
function disableAllEffects(part) {
    // 找到与该部件相关的所有复选框
    const partControls = document.querySelector(`[data-part-name="${part.name}"]`);
    if (partControls) {
        const checkboxes = partControls.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    }

    // 清理所有效果
    if (part.userData.particleSystem) {
        part.remove(part.userData.particleSystem);
        part.userData.particleSystem = null;
    }
    if (part.userData.trail) {
        scene.remove(part.userData.trail);
        part.userData.trail = null;
        part.userData.trailPoints = [];
    }
    if (part.userData.rainbowRing) {
        part.remove(part.userData.rainbowRing);
        part.userData.rainbowRing = null;
    }
    if (part.userData.lightning) {
        part.remove(part.userData.lightning);
        part.userData.lightning = null;
    }
    if (part.userData.mirrorCopy) {
        scene.remove(part.userData.mirrorCopy);
        part.userData.mirrorCopy = null;
    }

    // 重置所有状态
    part.userData = {
        ...part.userData,
        autoSpin: false,
        morphEnabled: false,
        magnetEnabled: false,
        particlesEnabled: false,
        showTrail: false,
        rainbowEnabled: false,
        lightningEnabled: false
    };

    // 确保部件可见
    part.visible = true;
    const visibilityCheckbox = document.querySelector(`#visibility-${part.name}`);
    if (visibilityCheckbox) {
        visibilityCheckbox.checked = true;
    }

    // 重置旋转
    part.rotation.set(0, 0, 0);
    rotationSpeeds[part.name] = 0;
    
    // 重置控制器
    const speedInput = document.querySelector(`input[type="range"][value="${rotationSpeeds[part.name]}"]`);
    if (speedInput) {
        speedInput.value = '0';
    }
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = Date.now() * 0.001;
    
    parts.forEach(part => {
        // 保存原始状态
        const originalPosition = part.position.clone();
        const originalRotation = part.rotation.clone();
        const originalScale = part.scale.clone();

        try {
            // 更新所有特效
            if (part.userData.autoSpin) {
                part.rotation.x += 0.01;
                part.rotation.z += 0.01;
            }

            if (part.userData.morphEnabled) {
                const scale = 1 + Math.sin(time * 2) * 0.2;
                part.scale.set(scale, 1/scale, scale);
            }

            if (part.userData.magnetEnabled) {
                let totalForce = new THREE.Vector3();
                parts.forEach(otherPart => {
                    if (otherPart !== part && otherPart.visible) {
                        const distance = part.position.distanceTo(otherPart.position);
                        if (distance < 3 && distance > 0.3) {
                            const force = (3 - distance) * 0.005;
                            const direction = new THREE.Vector3()
                                .subVectors(otherPart.position, part.position)
                                .normalize();
                            totalForce.add(direction.multiplyScalar(force));
                        }
                    }
                });
                if (totalForce.length() > 0.1) {
                    totalForce.normalize().multiplyScalar(0.1);
                }
                part.position.add(totalForce);
            }

            if (part.userData.showTrail) updateTrail(part);
            if (part.userData.mirrorEnabled && part.userData.mirrorCopy) {
                updateMirrorCopy(part);
            }
            if (part.userData.rainbowRing) updateRainbowRing(part, time);
            if (part.userData.lightningEnabled) updateLightning(part);
            if (part.userData.particlesEnabled) updateParticles(part, time);

            // 更新旋转
            const speed = rotationSpeeds[part.name];
            if (speed > 0) {
                const axis = part.userData.rotationAxis || 'y';
                part.rotation[axis] += speed * 0.02;
            }
        } catch (error) {
            console.error('Animation error:', error);
            part.position.copy(originalPosition);
            part.rotation.copy(originalRotation);
            part.scale.copy(originalScale);
        }
    });
    
    controls.update();
    renderer.render(scene, camera);
}

// 获取初始Y轴位置的辅助函数
function getInitialYPosition(partName) {
    const positions = {
        '前扣': 6,
        '盖子': 3,
        '主体': 0,
        '插片': -3,
        '内件': -6
    };
    return positions[partName];
}

// 分离各个更新函数以提高可维护性
function updateTrail(part) {
    if (!part.userData.trailPoints) {
        part.userData.trailPoints = [];
    }
    
    part.userData.trailPoints.push(part.position.clone());
    if (part.userData.trailPoints.length > 50) {
        part.userData.trailPoints.shift();
    }
    
    if (part.userData.trail) {
        const positions = new Float32Array(part.userData.trailPoints.length * 3);
        part.userData.trailPoints.forEach((point, i) => {
            positions[i * 3] = point.x;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z;
        });
        
        part.userData.trail.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );
        part.userData.trail.geometry.attributes.position.needsUpdate = true;
    }
}

function updateMirrorCopy(part) {
    if (!part.userData.mirrorCopy) return;

    const mirror = part.userData.mirrorCopy;
    
    // 更新位置（镜像）
    mirror.position.set(
        -part.position.x,
        part.position.y,
        part.position.z
    );
    
    // 同步旋转
    mirror.rotation.copy(part.rotation);
    
    // 同步缩放
    mirror.scale.copy(part.scale);
    
    // 同步材质颜色
    mirror.material.color.copy(part.material.color);
    
    // 同步可见性
    mirror.visible = part.visible;

    // 同步其他效果
    if (part.userData.particleSystem) {
        if (!mirror.userData.particleSystem) {
            createParticleSystem(mirror);
        }
        mirror.userData.particleSystem.visible = part.userData.particleSystem.visible;
    }

    if (part.userData.rainbowRing) {
        if (!mirror.userData.rainbowRing) {
            createRainbowRing(mirror);
        }
        mirror.userData.rainbowRing.visible = part.userData.rainbowRing.visible;
    }

    if (part.userData.lightning) {
        if (!mirror.userData.lightning) {
            createLightningEffect(mirror);
        }
        mirror.userData.lightning.visible = part.userData.lightning.visible;
    }
}

function updateLightning(part) {
    const points = [];
    for (let i = 0; i < 5; i++) {
        points.push(new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            -i * 0.2,
            (Math.random() - 0.5) * 0.3
        ));
    }
    part.userData.lightning.geometry.setFromPoints(points);
}

function updateParticles(part, time) {
    const positions = part.userData.particleSystem.geometry.attributes.position.array;
    const colors = part.userData.particleSystem.geometry.attributes.color.array;
    const initPositions = part.userData.particleInitPositions;

    for (let i = 0; i < positions.length; i += 3) {
        const angle = time + i;
        positions[i] = initPositions[i] + Math.sin(angle * 0.5) * 0.1;
        positions[i + 1] = initPositions[i + 1] + Math.cos(angle * 0.3) * 0.1;
        positions[i + 2] = initPositions[i + 2] + Math.sin(angle * 0.7) * 0.1;

        const hue = (time + i * 0.01) % 1;
        const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
    }

    part.userData.particleSystem.geometry.attributes.position.needsUpdate = true;
    part.userData.particleSystem.geometry.attributes.color.needsUpdate = true;
}

// 增强粒子系统
function createParticleSystem(part) {
    if (part.userData.particleSystem) {
        part.remove(part.userData.particleSystem);
    }

    const particleCount = 200; // 增加粒子数量
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // 创建更大范围的球形分布
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 0.8 + Math.random() * 0.5; // 增加粒子分布范围

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        // 更鲜艳的颜色
        const hue = Math.random(); // 随机色相
        const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;

        // 更大的粒子尺寸
        sizes[i] = 0.05 + Math.random() * 0.05;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particles, particleMaterial);
    part.userData.particleSystem = particleSystem;
    part.userData.particleInitPositions = positions.slice();
    part.add(particleSystem);
}

// 创建轨迹系统
function createTrail(part) {
    part.userData.trailPoints = [];
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.5
    });
    const trail = new THREE.Line(geometry, material);
    scene.add(trail);
    part.userData.trail = trail;
}

// 修改爆炸效果函数以适应不同大小的零件
function createExplosionEffect(part) {
    const scale = Math.max(
        part.geometry.parameters.width || 0.5,
        part.geometry.parameters.height || 0.5,
        part.geometry.parameters.radius || 0.5
    );
    
    const particleCount = Math.floor(50 * scale);
    const particles = [];
    const geometry = new THREE.BoxGeometry(0.1 * scale, 0.1 * scale, 0.1 * scale);
    const material = part.material.clone();

    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(part.position);
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.3
        );
        scene.add(particle);
        particles.push(particle);
    }

    const startTime = Date.now();
    const duration = 2000;
    
    function animateExplosion() {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
            particles.forEach(particle => {
                particle.position.add(particle.velocity);
                particle.velocity.y -= 0.01;
                particle.rotation.x += 0.1;
                particle.rotation.y += 0.1;
                // 逐渐降低不透明度
                particle.material.opacity = 1 - (elapsed / duration);
            });
            requestAnimationFrame(animateExplosion);
        } else {
            particles.forEach(particle => {
                scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            });
        }
    }
    
    animateExplosion();
}

function createMirrorCopy(part) {
    // 先清除已存在的镜像
    if (part.userData.mirrorCopy) {
        removeMirrorCopy(part);
    }

    // 创建新的镜像
    const mirrorGeometry = part.geometry.clone();
    const mirrorMaterial = part.material.clone();
    const mirrorCopy = new THREE.Mesh(mirrorGeometry, mirrorMaterial);
    
    // 设置初始位置和状态
    mirrorCopy.position.set(
        -part.position.x,  // 镜像位置
        part.position.y,
        part.position.z
    );
    mirrorCopy.rotation.copy(part.rotation);
    mirrorCopy.scale.copy(part.scale);
    
    // 添加到场景并保存引用
    scene.add(mirrorCopy);
    part.userData.mirrorCopy = mirrorCopy;

    // 同步可见性
    mirrorCopy.visible = part.visible;

    // 保存原始部件的引用
    mirrorCopy.userData.originalPart = part;
}

function removeMirrorCopy(part) {
    if (part.userData.mirrorCopy) {
        const mirror = part.userData.mirrorCopy;
        
        // 移除所有特效
        if (mirror.userData.particleSystem) {
            mirror.remove(mirror.userData.particleSystem);
            mirror.userData.particleSystem = null;
        }
        if (mirror.userData.rainbowRing) {
            mirror.remove(mirror.userData.rainbowRing);
            mirror.userData.rainbowRing = null;
        }
        if (mirror.userData.lightning) {
            mirror.remove(mirror.userData.lightning);
            mirror.userData.lightning = null;
        }
        
        // 清除几何体和材质
        mirror.geometry.dispose();
        mirror.material.dispose();
        
        // 从场景中移除
        scene.remove(mirror);
        
        // 清除引用
        part.userData.mirrorCopy = null;
    }
}

// 修改光环创建函数
function createRainbowRing(part) {
    // 确保先清除已存在的光环
    if (part.userData.rainbowRing) {
        part.remove(part.userData.rainbowRing);
        part.userData.rainbowRing = null;
    }

    const segments = 64;
    const innerRadius = 1.0;
    const outerRadius = 1.2;
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);
    const colors = new Float32Array(segments * 3 * 3);

    for (let i = 0; i < segments * 3; i++) {
        const hue = (i / (segments * 3)) % 1;
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    
    const ringContainer = new THREE.Group();
    ringContainer.add(ring);
    
    part.userData.rainbowRing = ringContainer;
    part.add(ringContainer);
}

// 创建闪电效果
function createLightningEffect(part) {
    if (part.userData.lightning) {
        part.remove(part.userData.lightning);
    }

    const lightningGroup = new THREE.Group();
    const lightningCount = 3; // 创建多条闪电

    for (let j = 0; j < lightningCount; j++) {
        const points = [];
        const segmentCount = 5;
        let prevPoint = new THREE.Vector3(0, 0.5, 0);
        points.push(prevPoint.clone());

        for (let i = 1; i < segmentCount; i++) {
            const newPoint = new THREE.Vector3(
                prevPoint.x + (Math.random() - 0.5) * 0.2,
                prevPoint.y - 0.2,
                prevPoint.z + (Math.random() - 0.5) * 0.2
            );
            points.push(newPoint.clone());
            prevPoint = newPoint;
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });

        const lightning = new THREE.Line(geometry, material);
        lightningGroup.add(lightning);
    }

    part.userData.lightning = lightningGroup;
    part.add(lightningGroup);
}

// 修改重置效果状态的函数
function resetEffectState(part, property) {
    switch(property) {
        case 'autoSpin':
            part.rotation.x = 0;
            part.rotation.z = 0;
            break;
        case 'showTrail':
            if (part.userData.trail) {
                scene.remove(part.userData.trail);
                part.userData.trail = null;
                part.userData.trailPoints = [];
            }
            break;
        case 'mirrorEnabled':
            if (part.userData.mirrorCopy) {
                scene.remove(part.userData.mirrorCopy);
                part.userData.mirrorCopy = null;
            }
            break;
        case 'morphEnabled':
            part.scale.set(1, 1, 1);
            break;
        case 'rainbowEnabled':
            if (part.userData.rainbowRing) {
                part.remove(part.userData.rainbowRing);
                part.userData.rainbowRing = null;
            }
            break;
        case 'magnetEnabled':
            const initialY = getInitialYPosition(part.name);
            part.position.set(0, initialY, 0);
            break;
        case 'lightningEnabled':
            if (part.userData.lightning) {
                part.remove(part.userData.lightning);
                part.userData.lightning = null;
            }
            break;
        case 'particlesEnabled':
            if (part.userData.particleSystem) {
                part.remove(part.userData.particleSystem);
                part.userData.particleSystem = null;
                part.userData.particleInitPositions = null;
            }
            break;
    }

    // 不要在重置时改变显示状态
    const visibilityCheckbox = document.querySelector(`#visibility-${part.name}`);
    if (visibilityCheckbox) {
        part.visible = visibilityCheckbox.checked;
    }
}

// 初始化并开始动画
init();
animate(); 