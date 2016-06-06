import * as THREE from 'three';

import {
  PIXEL_SCALE,
} from '../../../../canvas/Constants';

import View, { Position } from './View';
import WorldEditorCanvas from '../WorldEditorCanvas';

const radius = 1600, theta = 270, phi = 60;

const yUnit = new THREE.Vector3(0, 1, 0);

class BirdsEyeView implements View {
  camera: THREE.PerspectiveCamera;
  controls: any;

  private direction: THREE.Vector3;
  private cameraDirection: THREE.Vector3;

  constructor(private container: HTMLElement, renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private canvas: WorldEditorCanvas) {
    this.direction = new THREE.Vector3();
    this.cameraDirection = new THREE.Vector3();

    // Init camera
    const camera = new THREE.PerspectiveCamera(
      40, container.clientWidth / container.clientHeight, 1, 10000
    );
    camera.position.x = radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.z = radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.y = radius * Math.sin(phi * Math.PI / 360);

    this.camera = camera;

    // Init controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
  	controls.mouseButtons = Object.assign({}, controls.mouseButtons, {
      ORBIT: THREE.MOUSE.RIGHT,
      PAN: THREE.MOUSE.LEFT,
    });
    controls.minDistance = 300;
    controls.maxDistance = 3000;
	  controls.zoomSpeed = 1.0;
    controls.enableKeys = false;
    controls.enabled = true;
    controls.addEventListener('change', () => this.canvas.render());

    this.controls = controls;

    // TODO: Calculate position from parameter.
    this.setPosition({
      x: 8 * PIXEL_SCALE,
      y: 8 * PIXEL_SCALE,
      z: 8 * PIXEL_SCALE,
    });

    this.controls.update();
  }

  onEnter() {
    this.scene.add(this.camera);
    console.log('onEnter');
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
    // console.log(pos);
    // this.camera.getWorldDirection(this.direction);
    // this.camera.position.set(pos.x, pos.y, pos.z);
    // this.controls.target.copy(this.camera.position).add(this.direction);
  }

  onUpdate(): void {
    this.camera.getWorldDirection(this.cameraDirection);
    this.cameraDirection.applyAxisAngle(yUnit, Math.PI / 4);

    this.canvas.advertisingBoards.forEach(mesh => {
      const dotValue = this.cameraDirection.dot(mesh['__WORLD_DIRECTION__']);
      if (dotValue < 0) {
        mesh.visible = true;
        mesh.material.opacity = - dotValue * dotValue * dotValue;
      } else {
        mesh.visible = false;
      }
    });
  }

  onResize(): void {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
  }

  onDispose() {
    this.controls.dispose();
  }
}

export default BirdsEyeView;
