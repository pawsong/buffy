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
import WorldEditorCanvas from '../WorldEditorCanvas';

const radius = 1600, theta = 270, phi = 60;

const xUnit = new THREE.Vector3(1, 0, 0);
const yUnit = new THREE.Vector3(0, 1, 0);
const zUnit = new THREE.Vector3(0, 0, 1);

class BirdsEyeView implements View {
  camera: THREE.PerspectiveCamera;
  controls: any;

  private direction: THREE.Vector3;

  constructor(private container: HTMLElement, renderer: THREE.WebGLRenderer, private scene: THREE.Scene, private canvas: WorldEditorCanvas) {
    this.direction = new THREE.Vector3();

    // Init camera
    const camera = new THREE.PerspectiveCamera(
      40, container.offsetWidth / container.offsetHeight, 1, 10000
    );
    camera.position.x = radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.z = radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360);
    camera.position.y = radius * Math.sin(phi * Math.PI / 360);

    this.camera = camera;

    // Init controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
  	controls.mouseButtons = objectAssign({}, controls.mouseButtons, {
      ORBIT: THREE.MOUSE.RIGHT,
      PAN: THREE.MOUSE.LEFT,
    });
    controls.minDistance = 300;
    controls.maxDistance = 3000;
	  controls.zoomSpeed = 1.0;
    controls.enableKeys = false;
    controls.enabled = true;

    this.controls = controls;

    // TODO: Calculate position from parameter.
    this.setPosition({
      x: 8 * BOX_SIZE,
      y: 8 * BOX_SIZE,
      z: 8 * BOX_SIZE,
    });
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
    console.log(pos);
    // this.camera.getWorldDirection(this.direction);
    // this.camera.position.set(pos.x, pos.y, pos.z);
    // this.controls.target.copy(this.camera.position).add(this.direction);
  }

  onUpdate(): void {
    this.controls.update();
    const direction = this.camera.getWorldDirection();
    const dot = zUnit.dot(direction);
    if (dot < 0) {
      this.canvas.advertisingBoardMesh.visible = true;
      this.canvas.advertisingBoardMesh.material.opacity = -dot;
    } else {
      this.canvas.advertisingBoardMesh.visible = false;
    }
  }

  onResize(): void {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }

  onDispose() {
    this.controls.dispose();
  }
}

export default BirdsEyeView;
