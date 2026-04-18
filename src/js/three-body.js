/* ─── THREE.JS 3D MEDICAL MANNEQUIN ─────────────────────── */
import { toggleRegion } from './features/symptoms.js';
import { state } from './state.js';

let scene, camera, renderer, mannequinParts = {};
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

export function initThreeBody(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Initialize
  scene = new THREE.Scene();
  // Soft blue gradient-like background feel (via lighting)
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 4.8;
  camera.position.y = 0.2;

  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Studio Lighting Setup
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);
  
  const frontLight = new THREE.DirectionalLight(0xffffff, 1.2);
  frontLight.position.set(0, 5, 10);
  scene.add(frontLight);

  const sideLight = new THREE.PointLight(0x00A3FF, 1.5, 50); // Soft Blue Rim Light
  sideLight.position.set(-5, 2, 5);
  scene.add(sideLight);

  const sideLight2 = new THREE.PointLight(0xffffff, 0.8, 50); // White Rim Light
  sideLight2.position.set(5, 2, 5);
  scene.add(sideLight2);

  // Helper to create body parts with "Smooth Muscle" Capsules
  function createPart(geometry, pos, id, label) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xFAFAFA, // Clean White
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.95,
      emissive: 0x00A3FF, // Subtle Blue Glow
      emissiveIntensity: 0
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...pos);
    mesh.userData = { id, label };
    scene.add(mesh);
    mannequinParts[id] = mesh;
    return mesh;
  }

  // Build Premium Stylized Mannequin using Capsules (Requires THREE.CapsuleGeometry)
  // Fallback to Cylinders with spherical caps if CapsuleGeometry isn't available in CDN 0.160
  const Cap = (r, l) => new THREE.CapsuleGeometry(r, l, 20, 20);

  createPart(new THREE.SphereGeometry(0.32, 32, 32), [0, 1.9, 0], 'head', 'Head');
  createPart(Cap(0.08, 0.1), [0, 1.55, 0], 'neck', 'Neck');
  createPart(Cap(0.38, 0.6), [0, 1.1, 0], 'chest', 'Chest');
  createPart(Cap(0.34, 0.4), [0, 0.5, 0], 'abdomen', 'Abdomen');
  
  // Arms
  createPart(Cap(0.1, 0.9), [-0.55, 1.1, 0], 'larm', 'Left Arm');
  createPart(Cap(0.1, 0.9), [0.55, 1.1, 0], 'rarm', 'Right Arm');
  
  // Legs
  createPart(Cap(0.14, 1.1), [-0.25, -0.5, 0], 'lleg', 'Left Leg');
  createPart(Cap(0.14, 1.1), [0.25, -0.5, 0], 'rleg', 'Right Leg');

  // Feet
  createPart(Cap(0.12, 0.2), [-0.25, -1.25, 0.1], 'lfoot', 'Left Foot');
  createPart(Cap(0.12, 0.2), [0.25, -1.25, 0.1], 'rfoot', 'Right Foot');

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    
    // Slow rotation
    scene.rotation.y += 0.007;

    // Update colors based on state
    for (const [id, mesh] of Object.entries(mannequinParts)) {
      const isSelected = !!state.selectedRegions[id];
      // Selected: Medical Accent (Teal/Green) | Normal: Clean White/Blue highlight
      mesh.material.color.setHex(isSelected ? 0x1D9E75 : 0xFAFAFA);
      mesh.material.emissiveIntensity = isSelected ? 0.8 : 0.05;
      mesh.material.roughness = isSelected ? 0.1 : 0.3;
      
      if (isSelected) {
        mesh.scale.set(1.05, 1.05, 1.05); // Pulsing/Growing effect
      } else {
        mesh.scale.set(1, 1, 1);
      }
    }

    renderer.render(scene, camera);
  }

  animate();
  
  // Interaction
  container.addEventListener('click', (e) => {
    const rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(mannequinParts));

    if (intersects.length > 0) {
      const part = intersects[0].object;
      if (part.userData.id) {
        toggleRegion(part.userData.id, part.userData.label);
      }
    }
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    if (!container) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
