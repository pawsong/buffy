import * as THREE from 'three';
const objectAssign = require('object-assign');

import DesignManager from '../../../canvas/DesignManager';
import Canvas from '../../../Canvas';

import {
  BOX_SIZE,
  GRID_SIZE,
  PIXEL_UNIT,
} from './Constants';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/controls/OrbitControls');
}

class MapCanvas extends Canvas {
  camera: THREE.OrthographicCamera;
  controls: any;

  constructor(container: HTMLElement, designManager: DesignManager) {
    super(container, designManager);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
  	this.controls.mouseButtons = objectAssign({}, this.controls.mouseButtons, {
      ORBIT: THREE.MOUSE.RIGHT,
      PAN: THREE.MOUSE.LEFT,
    });
    this.controls.maxDistance = 2000;
    this.controls.enableKeys = false;
    this.controls.enableRotate = false;

    // Terrains
    for (let i = 1; i <= 10; ++i) {
      for (let j = 1; j <= 10; ++j) {
        this.terrainManager.findAndUpdate(i, j, 0xffffff);
      }
    }
  }

  getCamera() {
    const camera = new THREE.OrthographicCamera(
      this.container.offsetWidth / - 2,
      this.container.offsetWidth / 2,
      this.container.offsetHeight / 2,
      this.container.offsetHeight / - 2,
      - GRID_SIZE, 2 * GRID_SIZE
    );
    camera.position.x = 200;
    camera.position.y = 200;
    camera.position.z = 200;

    return camera;
  }

  handleWindowResize() {
    this.camera.left = this.container.offsetWidth / - 2;
    this.camera.right = this.container.offsetWidth / 2;
    this.camera.top = this.container.offsetHeight / 2;
    this.camera.bottom = this.container.offsetHeight / - 2;
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight);
  }

  render(dt = 0) {
    super.render(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

export default MapCanvas;
