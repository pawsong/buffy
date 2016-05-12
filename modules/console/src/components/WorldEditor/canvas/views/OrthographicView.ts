import * as THREE from 'three';
const objectAssign = require('object-assign');

import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from '../../Constants';

import View, { Position } from './View';

class OrthographicView implements View {
  camera: THREE.OrthographicCamera;
  controls: any;

  private direction: THREE.Vector3;

  constructor(private container: HTMLElement, renderer: THREE.WebGLRenderer, private scene: THREE.Scene) {
    this.direction = new THREE.Vector3();

    // Init camera
    const camera = new THREE.OrthographicCamera(
      this.container.offsetWidth / -2,
      this.container.offsetWidth / +2,
      this.container.offsetHeight / -2,
      this.container.offsetHeight / +2,
      - 2000, 5000
    );
    camera.position.x = 1;
    camera.position.y = 1;
    camera.position.z = 1;
    camera.lookAt(scene.position);

    this.camera = camera;

    // Init controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
  	controls.mouseButtons = objectAssign({}, controls.mouseButtons, {
      ORBIT: THREE.MOUSE.RIGHT,
      PAN: THREE.MOUSE.LEFT,
    });
    controls.maxDistance = 2000;
    controls.enableKeys = false;
    // controls.enableRotate = false;
    controls.enabled = true;

    this.controls = controls;

    this.setPosition({ x: 1, y: 1, z: 1 });
  }

  onEnter() {
    this.scene.add(this.camera);
  }

  onLeave() {
    this.scene.remove(this.camera);
  }

  addPosition(pos: Position): void {
    this.setPosition({
      x: this.camera.position.x + pos.x,
      y: this.camera.position.y + pos.y,
      z: this.camera.position.z + pos.z,
    });
  }

  setPosition(pos: Position): void {
    this.camera.getWorldDirection(this.direction);
    this.camera.position.set(pos.x, pos.y, pos.z);
    this.controls.target.copy(this.camera.position).add(this.direction);
  }

  onUpdate(): void {
    this.controls.update();
  }

  onResize(): void {
    this.camera.left = this.container.offsetWidth / - 2;
    this.camera.right = this.container.offsetWidth / 2;
    this.camera.top = this.container.offsetHeight / 2;
    this.camera.bottom = this.container.offsetHeight / - 2;
    this.camera.updateProjectionMatrix();
  }

  onDispose() {
    this.controls.dispose();
  }
}

export default OrthographicView;
