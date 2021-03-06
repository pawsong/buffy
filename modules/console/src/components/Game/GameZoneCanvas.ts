import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import ZoneCanvas from '../../canvas/ZoneCanvas';

if (__CLIENT__) {
  window['THREE'] = THREE;
  require('three/examples/js/effects/CardboardEffect');
  require('three/examples/js/controls/MouseControls');
}

class GameZoneCanvas extends ZoneCanvas {
  private controls: any;
  camera: THREE.PerspectiveCamera;

  // constructor(container: HTMLElement, stateLayer: StateLayer, designManager: DesignManager, playerId: string) {
  //   super(container, designManager, stateLayer, () => ({ playerId }));
  //   this.controls = new THREE['MouseControls'](this.camera);
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
  }

  render(dt = 0) {
    super.render(dt);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    super.destroy();
    this.controls.dispose();
  }
}

export default GameZoneCanvas;
