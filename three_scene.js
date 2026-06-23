// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
    initThreeJS();
});

function initThreeJS() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    // Move camera back slightly
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ 
        canvas: canvas,
        alpha: true,
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0x3b82f6, 2);
    directionalLight1.position.set(10, 20, 10);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(-10, -20, -10);
    scene.add(directionalLight2);

    // Geometry - Icosahedron for better vertex manipulation
    const geometry = new THREE.IcosahedronGeometry(10, 30);
    
    // Store original positions for morphing
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    const originalPositions = [];
    for ( let i = 0; i < positionAttribute.count; i ++ ) {
        vertex.fromBufferAttribute( positionAttribute, i );
        originalPositions.push(vertex.clone());
    }

    // Material - Glass-like
    const material = new THREE.MeshPhysicalMaterial({
        color: 0x1e3a8a,
        metalness: 0.1,
        roughness: 0.2,
        transmission: 0.9, // glass-like
        ior: 1.5,
        thickness: 0.5,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Move sphere to the right for desktop, center for mobile
    const updateSpherePosition = () => {
        if(window.innerWidth > 992) {
            sphere.position.x = 12;
            sphere.position.y = 0;
        } else {
            sphere.position.x = 0;
            sphere.position.y = 5;
        }
    };
    updateSpherePosition();

    // Noise setup
    const simplex = new SimplexNoise();
    let time = 0;

    // Mouse Parallax setup
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - window.innerWidth / 2);
        mouseY = (event.clientY - window.innerHeight / 2);
    });

    // Scroll setup
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // Resize handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        updateSpherePosition();
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        
        time += 0.005;

        // Morphing vertices
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const p = originalPositions[i];
            // Calculate noise based on original position and time
            const noise = simplex.noise3D(
                p.x * 0.1 + time, 
                p.y * 0.1 + time, 
                p.z * 0.1
            );
            
            // Map noise from [-1, 1] to [0.8, 1.2]
            const displacement = 1 + noise * 0.2;
            
            positions.setXYZ(
                i,
                p.x * displacement,
                p.y * displacement,
                p.z * displacement
            );
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals(); // Recalculate normals for lighting

        // Parallax effect
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        
        sphere.rotation.y += 0.002 + (targetX - sphere.rotation.y) * 0.05;
        sphere.rotation.x += 0.002 + (targetY - sphere.rotation.x) * 0.05;

        // Scroll effect (moves the sphere up slightly on scroll)
        camera.position.y = -(scrollY * 0.005);

        renderer.render(scene, camera);
    }

    // Hide loader once Three.js is ready
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.classList.add('hidden');
        }
    }, 1500);

    animate();
}
