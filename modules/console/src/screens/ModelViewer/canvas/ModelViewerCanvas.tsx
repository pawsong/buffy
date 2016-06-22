import THREE from 'three';
import Canvas from '../../../canvas/Canvas';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../canvas/Constants';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

const THUMBNAIL_SIZE = 256;
const radius = 80, theta = 135, phi = 30;

class ModelViewerCanvas extends Canvas {
  geometry: THREE.Geometry;
  camera: THREE.PerspectiveCamera;
  controls: any;

  private light: THREE.DirectionalLight;

  constructor(container: HTMLElement, geometry: THREE.Geometry) {
    super(container);
    this.geometry = geometry;
  }

  init() {
    super.init();
    this.renderer.setClearColor(0xffffff);

    this.light = new THREE.DirectionalLight(0xffffff);

    const d = 15 * PIXEL_SCALE;
    this.light.shadow.camera['left'] = - d;
    this.light.shadow.camera['right'] = d;
    this.light.shadow.camera['top'] = d;
    this.light.shadow.camera['bottom'] = - d;
    this.light.shadow.camera['far'] = 2000;
    this.scene.add(this.light);

    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      vertexColors: THREE.VertexColors,
    });

    const mesh = new THREE.Mesh(this.geometry, material);
    this.scene.add(mesh);

		this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => {
      this.syncLightToCamera();
      this.render();
    });

    const size = this.geometry.boundingBox.size();
    this.controls.target.copy(size).divideScalar(2);
    this.controls.update();

    this.onWindowResize();
    this.syncLightToCamera();
    this.render();
  }

  initCamera() {
    const camera = new THREE.PerspectiveCamera(
      40, THUMBNAIL_SIZE / THUMBNAIL_SIZE, 1, 10000
    );
    camera.position.x = radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.z = radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.y = radius * Math.sin(phi * Math.PI / 360);
    camera.lookAt(this.scene.position);

    return camera;
  }

  syncLightToCamera() {
    this.light.position.copy(this.camera.position);
    this.light.lookAt(this.controls.target);
  }

  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.render();
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

export default ModelViewerCanvas;
