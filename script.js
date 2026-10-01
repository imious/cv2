import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const canvas = document.querySelector('#portrait');
const stage = canvas?.parentElement;
if (canvas && stage) {
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.12, 5.2);
    scene.add(new THREE.HemisphereLight(0xf6f5e9, 0x46513c, 2.1));
    const key = new THREE.DirectionalLight(0xffe7c6, 3.2);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xc9e7aa, 2.5);
    rim.position.set(3, 2, -3);
    scene.add(rim);

    const rig = new THREE.Group();
    scene.add(rig);
    let model;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('./vendor/draco/');
    new GLTFLoader().setDRACOLoader(dracoLoader).load('./3D%20model.glb', ({ scene: object }) => {
      model = object;
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.scale.setScalar(2.15 / Math.max(size.y, size.x, size.z));
      rig.add(model);
      model.rotation.y = -0.12;
    }, undefined, error => {
      canvas.classList.add('model-unavailable');
      console.warn('The 3D portrait could not be loaded.', error);
    });

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = width < 620 ? 5.7 : 5.2;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(stage);
    resize();

    let scrollTarget = 0;
    const updateScroll = () => {
      const rect = stage.getBoundingClientRect();
      const progress = THREE.MathUtils.clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
      scrollTarget = (progress - 0.5) * 1.65;
    };
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    const pointer = { x: 0, y: 0 };
    stage.addEventListener('pointermove', event => {
      const rect = stage.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width - 0.5) * 0.22;
      pointer.y = ((event.clientY - rect.top) / rect.height - 0.5) * 0.12;
    });
    stage.addEventListener('pointerleave', () => { pointer.x = 0; pointer.y = 0; });

    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      rig.rotation.y += (scrollTarget + pointer.x - rig.rotation.y) * 0.035;
      rig.rotation.x += (-pointer.y - rig.rotation.x) * 0.035;
      rig.position.y = Math.sin(t * 0.8) * 0.035;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  } catch (error) {
    canvas.classList.add('model-unavailable');
  }
}
