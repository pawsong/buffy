import * as THREE from 'three';

import Canvas from '../../../Canvas';

import { GRID_SIZE } from './Constants';

class MapCanvas extends Canvas {
  camera: THREE.OrthographicCamera;

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
}

export default MapCanvas;
