let scene, camera, renderer, controls;
const parts = [];

function init() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // 添加轨道控制
    controls = new THREE.OrbitControls(camera, renderer.domElement);

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
    // 创建几个示例零件
    const geometries = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.CylinderGeometry(0.5, 0.5, 2, 32),
        new THREE.SphereGeometry(0.5, 32, 32)
    ];

    const positions = [
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2, 0, 0)
    ];

    geometries.forEach((geometry, index) => {
        const material = new THREE.MeshPhongMaterial({
            color: Math.random() * 0xffffff
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(positions[index]);
        mesh.name = `Part_${index + 1}`;
        scene.add(mesh);
        parts.push(mesh);
    });
}

function createControls() {
    const container = document.getElementById('partControls');
    
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
        container.appendChild(div);
    });
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// 初始化并开始动画
init();
animate(); 