import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import ZoneCanvas from '../../canvas/ZoneCanvas';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/effects/CardboardEffect');
  if (__IS_MOBILE__) {
    require('three/examples/js/controls/DeviceOrientationControls');
  } else {
    require('three/examples/js/controls/MouseControls');
  }
}

class CardboardZoneCanvas extends ZoneCanvas {
  private controls: any;
  camera: THREE.PerspectiveCamera;
  effect: any;

  // constructor(container: HTMLElement, stateLayer: StateLayer, designManager: DesignManager, playerId: string) {
  //   super(container, designManager, stateLayer, () => ({ playerId }));
  //   this.effect = new THREE['CardboardEffect'](this.renderer);
  //   if (__IS_MOBILE__) {
  //     this.controls = new THREE['DeviceOrientationControls'](this.camera);
  //   } else {
  //     this.controls = new THREE['MouseControls'](this.camera);
  //   }
  // }

  initCamera() {
    const camera = new THREE.PerspectiveCamera(90, this.container.clientWidth / this.container.clientHeight, 0.001, 700);
    // camera.position.set(0, 15, 0);
    return camera;
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.effect.setSize(width, height);
  }

  render(dt = 0) {
    super.render(dt);
    this.controls.update();
    this.effect.render(this.scene, this.camera);
  }

  destroy() {
    super.destroy();
    this.controls.dispose();
  }
}

export default CardboardZoneCanvas;
