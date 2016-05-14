import * as THREE from 'three';

import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import View, { Position } from './View';

class FirstPersonView implements View {
  camera: THREE.PerspectiveCamera;
  controls: any;

  private prevTime: number;
  private velocity: THREE.Vector3;

  private moveForward: boolean;
  private moveBackward: boolean;
  private moveLeft: boolean;
  private moveRight: boolean;

  private boundHandleKeyDown: (e: KeyboardEvent) => any;
  private boundHandleKeyUp: (e: KeyboardEvent) => any;

  private controlObject: THREE.Object3D;

  constructor(private container: HTMLElement, renderer: THREE.WebGLRenderer, private scene: THREE.Scene) {
    // Init camera
    const camera = new THREE.PerspectiveCamera(
      90,
      this.container.offsetWidth / this.container.offsetHeight,
      0.001,
      700
    );
    // camera.position.set(PIXEL_SCALE, 3 * PIXEL_SCALE + PIXEL_SCALE_HALF, PIXEL_SCALE);
    this.camera = camera;

    // Init controls
    const controls = new THREE['PointerLockControls'](this.camera);
    this.controls = controls;
    this.controls.enabled = true;

    this.controlObject = controls.getObject();
    this.controlObject.position.set(PIXEL_SCALE, 3 * PIXEL_SCALE + PIXEL_SCALE_HALF, PIXEL_SCALE);

    this.boundHandleKeyDown =  this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);

    this.velocity = new THREE.Vector3();
  }

  private handleKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        this.moveForward = true;
        break;
      case 37: // left
      case 65: // a
        this.moveLeft = true;
        break;
      case 40: // down
      case 83: // s
        this.moveBackward = true;
        break;
      case 39: // right
      case 68: // d
        this.moveRight = true;
        break;
    }
  }

  private handleKeyUp(event: KeyboardEvent) {
    switch(event.keyCode) {
      case 38: // up
      case 87: // w
        this.moveForward = false;
        break;
      case 37: // left
      case 65: // a
        this.moveLeft = false;
        break;
      case 40: // down
      case 83: // s
        this.moveBackward = false;
        break;
      case 39: // right
      case 68: // d
        this.moveRight = false;
        break;
    }
  }

  onEnter() {
    document.addEventListener('keydown', this.boundHandleKeyDown, false );
    document.addEventListener('keyup', this.boundHandleKeyUp, false );

    this.scene.add(this.controlObject);
    this.prevTime = performance.now();
    this.velocity.set(0, 0, 0);
  }

  onLeave() {
    document.removeEventListener('keydown', this.boundHandleKeyDown, false );
    document.removeEventListener('keyup', this.boundHandleKeyUp, false );

    this.scene.remove(this.controlObject);
  }

  addPosition(pos: Position): void {
    this.controlObject.position.add(<THREE.Vector3>(pos));
  }

  setPosition(pos: Position): void {
    this.controlObject.position.copy(<THREE.Vector3>(pos));
  }

  onUpdate(): void {
      const time = performance.now();
      const delta = ( time - this.prevTime ) * 2 / 1000;

      this.velocity.x -= this.velocity.x * 10.0 * delta;
      this.velocity.z -= this.velocity.z * 10.0 * delta;
      // this.velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

      if (this.moveForward) this.velocity.z -= 400.0 * delta;
      if (this.moveBackward) this.velocity.z += 400.0 * delta;
      if (this.moveLeft) this.velocity.x -= 400.0 * delta;
      if (this.moveRight) this.velocity.x += 400.0 * delta;

      this.controlObject.translateX( this.velocity.x * delta );
      // this.controlObject.translateY( this.velocity.y * delta );
      this.controlObject.translateZ( this.velocity.z * delta );

      // if (this.controlObject.position.y < 10) {
      //   this.velocity.y = 0;
      //   this.controlObject.position.y = 10;
      // }

      this.prevTime = time;
  }

  onResize(): void {
    this.camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
    this.camera.updateProjectionMatrix();
  }

  onDispose() {
    this.onLeave();
    this.controls.dispose();
  }
}

export default FirstPersonView;
